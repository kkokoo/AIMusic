import smtplib
import random
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("email")

_verify_codes: dict[str, tuple[str, float]] = {}


def generate_code(length: int = 6) -> str:
    return ''.join(str(random.randint(0, 9)) for _ in range(length))


def store_code(email: str, code: str, ttl: int = 300):
    _verify_codes[email.lower()] = (code, time.time() + ttl)
    logger.info("[email] 验证码已存储 | email=%s | ttl=%ds", email, ttl)


def verify_code(email: str, code: str) -> bool:
    entry = _verify_codes.get(email.lower())
    if not entry:
        return False
    stored_code, expires_at = entry
    if time.time() > expires_at:
        del _verify_codes[email.lower()]
        return False
    if stored_code != code:
        return False
    del _verify_codes[email.lower()]
    return True


async def send_verify_email(to_email: str, code: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"AI Music - 邮箱验证码: {code}"
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
        msg["To"] = to_email

        html = f"""\
<html>
<body style="font-family: Arial, sans-serif; background: #0a0a1a; padding: 30px;">
  <div style="max-width: 480px; margin: 0 auto; background: #111128; border-radius: 16px; padding: 32px; border: 1px solid #06b6d4;">
    <h2 style="color: #06b6d4; margin: 0 0 8px;">AI Music</h2>
    <p style="color: #94a3b8; font-size: 14px;">你的邮箱验证码如下，请在 5 分钟内完成验证：</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #fff; background: #06b6d4; padding: 12px 28px; border-radius: 12px; display: inline-block;">
        {code}
      </span>
    </div>
    <p style="color: #64748b; font-size: 12px;">如果这不是你的操作，请忽略此邮件。</p>
  </div>
</body>
</html>"""

        msg.attach(MIMEText(html, "html", "utf-8"))

        def _send():
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, to_email, msg.as_string())

        import asyncio
        await asyncio.to_thread(_send)

        logger.info("[email] 验证码邮件已发送 | to=%s | code=%s", to_email, code)
        return True
    except Exception as e:
        logger.error("[email] 发送失败 | to=%s | error=%s", to_email, str(e))
        return False