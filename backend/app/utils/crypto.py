from cryptography.fernet import Fernet
import os
import base64

# 从环境变量获取密钥，如果没有则生成一个
SECRET_KEY = os.getenv("ENCRYPTION_KEY")

if not SECRET_KEY:
    # 生成一个固定的密钥用于开发环境
    # 生产环境应该使用环境变量设置
    SECRET_KEY = base64.urlsafe_b64encode(b"email_admin_secret_key_32bytes!!")

_fernet = None


def get_fernet():
    """获取 Fernet 实例"""
    global _fernet
    if _fernet is None:
        if isinstance(SECRET_KEY, str):
            key = SECRET_KEY.encode()
        else:
            key = SECRET_KEY
        _fernet = Fernet(key)
    return _fernet


def encrypt_password(password: str) -> str:
    """加密密码"""
    fernet = get_fernet()
    encrypted = fernet.encrypt(password.encode())
    return encrypted.decode()


def decrypt_password(encrypted_password: str) -> str:
    """解密密码"""
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted_password.encode())
    return decrypted.decode()
