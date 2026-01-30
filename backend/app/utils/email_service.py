import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr, parsedate_to_datetime
from typing import List, Dict, Any, Optional, Tuple
import ssl

from app.logger import logger


class EmailService:
    """邮件服务类，用于连接 IMAP 服务器获取邮件"""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        use_ssl: bool = True
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_ssl = use_ssl
        self.connection: Optional[imaplib.IMAP4] = None

    def connect(self) -> bool:
        """连接到 IMAP 服务器"""
        try:
            if self.use_ssl:
                context = ssl.create_default_context()
                self.connection = imaplib.IMAP4_SSL(
                    self.host, self.port, ssl_context=context
                )
            else:
                self.connection = imaplib.IMAP4(self.host, self.port)

            self.connection.login(self.username, self.password)
            
            # 发送 IMAP ID 命令（163邮箱等需要此命令来标识客户端）
            self._send_id_command()
            
            return True
        except Exception as e:
            logger.error(f"连接失败: {e}")
            return False

    def _send_id_command(self):
        """发送 IMAP ID 命令，用于标识客户端（163邮箱等需要）"""
        try:
            id_string = '("name" "EmailAdmin" "version" "1.0.0" "vendor" "EmailAdmin" "support-email" "admin@emailadmin.com")'
            
            tag = self.connection._new_tag()
            if isinstance(tag, bytes):
                tag = tag.decode()
            
            cmd = f'{tag} ID {id_string}\r\n'
            self.connection.send(cmd.encode())
            
            # 读取响应直到收到带有标签的响应行
            while True:
                line = self.connection.readline()
                if not line:
                    break
                line_str = line.decode('utf-8', errors='ignore').strip()
                
                if line_str.startswith(tag):
                    if 'OK' in line_str:
                        logger.debug("IMAP ID 命令发送成功")
                    break
                    
        except Exception as e:
            logger.warning(f"发送 ID 命令失败: {e}")

    def disconnect(self):
        """断开连接"""
        if self.connection:
            try:
                self.connection.logout()
            except Exception:
                pass
            self.connection = None

    def test_connection(self) -> Tuple[bool, str]:
        """测试连接"""
        try:
            if self.connect():
                self.disconnect()
                return True, "连接成功"
            return False, "连接失败"
        except imaplib.IMAP4.error as e:
            return False, f"认证失败: {str(e)}"
        except Exception as e:
            return False, f"连接错误: {str(e)}"

    def get_folders(self) -> List[Dict[str, Any]]:
        """获取邮件文件夹列表"""
        if not self.connection:
            if not self.connect():
                return []

        folders = []
        try:
            status, folder_list = self.connection.list()
            if status == "OK":
                for folder_data in folder_list:
                    if folder_data:
                        folder_str = folder_data.decode() if isinstance(folder_data, bytes) else folder_data
                        parts = folder_str.split(' "/" ')
                        if len(parts) >= 2:
                            folder_name = parts[-1].strip('"')
                            folders.append({
                                "name": folder_name,
                                "path": folder_name,
                                "count": 0,
                                "unread_count": 0
                            })
        except Exception as e:
            logger.error(f"获取文件夹失败: {e}")

        return folders

    def get_emails(
        self,
        folder: str = "INBOX",
        limit: int = 20,
        offset: int = 0,
        fetch_body: bool = False
    ) -> Tuple[List[Dict[str, Any]], int]:
        """获取邮件列表"""
        if not self.connection:
            if not self.connect():
                logger.error("连接失败")
                return [], 0

        emails_list = []
        total = 0
        try:
            status, select_data = self.connection.select(folder)
            
            if status != "OK":
                logger.warning(f"选择文件夹 {folder} 失败，尝试重新连接")
                self.disconnect()
                if not self.connect():
                    logger.error("重新连接失败")
                    return [], 0
                status, select_data = self.connection.select(folder)
                if status != "OK":
                    logger.error(f"重新连接后选择文件夹仍然失败")
                    return [], 0

            status, messages = self.connection.search(None, "ALL")
            if status != "OK":
                logger.error("搜索邮件失败")
                return [], 0

            if not messages[0]:
                logger.info("邮箱为空")
                return [], 0

            message_ids = messages[0].split()
            total = len(message_ids)

            message_ids = message_ids[::-1]

            start = offset
            end = min(offset + limit, total)
            page_ids = message_ids[start:end]

            for msg_id in page_ids:
                try:
                    email_data = self._fetch_email(msg_id, fetch_body=fetch_body)
                    if email_data:
                        emails_list.append(email_data)
                except Exception as e:
                    logger.error(f"获取单封邮件失败 {msg_id}: {e}")
                    continue

        except Exception as e:
            logger.error(f"获取邮件失败: {e}")

        return emails_list, total

    def get_email_by_id(self, folder: str, msg_id: str) -> Optional[Dict[str, Any]]:
        """获取单封邮件详情"""
        if not self.connection:
            if not self.connect():
                return None

        try:
            status, _ = self.connection.select(folder)
            if status != "OK":
                return None

            return self._fetch_email(msg_id.encode(), fetch_body=True)
        except Exception as e:
            logger.error(f"获取邮件详情失败: {e}")
            return None

    def _fetch_email(
        self,
        msg_id: bytes,
        fetch_body: bool = False
    ) -> Optional[Dict[str, Any]]:
        """获取邮件数据"""
        try:
            fetch_type = "(RFC822)" if fetch_body else "(RFC822.HEADER)"
            status, msg_data = self.connection.fetch(msg_id, fetch_type)

            if status != "OK" or not msg_data[0]:
                return None

            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            from_header = msg.get("From", "")
            from_name, from_addr = parseaddr(from_header)
            from_name = self._decode_header(from_name) if from_name else None

            to_header = msg.get("To", "")
            to_addresses = self._parse_addresses(to_header)

            cc_header = msg.get("Cc", "")
            cc_addresses = self._parse_addresses(cc_header) if cc_header else None

            subject = self._decode_header(msg.get("Subject", ""))

            date_str = msg.get("Date", "")
            try:
                date = parsedate_to_datetime(date_str) if date_str else None
            except Exception:
                date = None

            body = ""
            body_html = ""
            attachments = []

            inline_images = {}
            if fetch_body:
                body, body_html, attachments, inline_images = self._parse_body(msg)

            return {
                "message_id": msg.get("Message-ID", ""),
                "from": {"name": from_name, "address": from_addr},
                "to": to_addresses,
                "cc": cc_addresses,
                "subject": subject,
                "date": date,
                "body": body,
                "body_html": body_html,
                "has_attachments": len(attachments) > 0,
                "attachments": attachments,
                "inline_images": inline_images
            }

        except Exception as e:
            logger.error(f"解析邮件失败: {e}")
            return None

    def _decode_header(self, header: str) -> str:
        """解码邮件头部"""
        if not header:
            return ""

        decoded_parts = decode_header(header)
        result = []

        for content, charset in decoded_parts:
            if isinstance(content, bytes):
                try:
                    if charset:
                        result.append(content.decode(charset))
                    else:
                        result.append(content.decode("utf-8", errors="ignore"))
                except Exception:
                    result.append(content.decode("utf-8", errors="ignore"))
            else:
                result.append(content)

        return "".join(result)

    def _parse_addresses(self, header: str) -> List[Dict[str, Any]]:
        """解析地址列表"""
        addresses = []
        if not header:
            return addresses

        for addr_str in header.split(","):
            name, addr = parseaddr(addr_str.strip())
            if addr:
                addresses.append({
                    "name": self._decode_header(name) if name else None,
                    "address": addr
                })

        return addresses

    def _parse_body(self, msg) -> Tuple[str, str, List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
        """解析邮件正文、附件和内嵌图片
        
        Returns:
            Tuple[str, str, List[Dict], Dict[str, Dict]]: 
                - body: 纯文本正文
                - body_html: HTML正文
                - attachments: 附件列表
                - inline_images: 内嵌图片字典 {cid: {content_type, data}}
        """
        body = ""
        body_html = ""
        attachments = []
        inline_images = {}  # 存储内嵌图片 {cid: {content_type, data}}

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                content_id = part.get("Content-ID", "")
                
                # 处理内嵌图片 (通过 Content-ID 标识)
                if content_id and content_type.startswith("image/"):
                    # 移除 Content-ID 的尖括号
                    cid = content_id.strip("<>")
                    payload = part.get_payload(decode=True)
                    if payload:
                        import base64
                        inline_images[cid] = {
                            "content_type": content_type,
                            "data": base64.b64encode(payload).decode("utf-8")
                        }
                elif "attachment" in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        filename = self._decode_header(filename)
                        attachments.append({
                            "filename": filename,
                            "content_type": content_type,
                            "size": len(part.get_payload(decode=True) or b"")
                        })
                elif content_type == "text/plain" and not body:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        body = payload.decode(charset, errors="ignore")
                elif content_type == "text/html" and not body_html:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        body_html = payload.decode(charset, errors="ignore")
        else:
            content_type = msg.get_content_type()
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or "utf-8"
                if content_type == "text/html":
                    body_html = payload.decode(charset, errors="ignore")
                else:
                    body = payload.decode(charset, errors="ignore")

        return body, body_html, attachments, inline_images
