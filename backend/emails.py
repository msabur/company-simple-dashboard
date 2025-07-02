from fastapi_mail import FastMail, MessageSchema, MessageType
from config import MAIL_CONFIG
from schemas import EmailSchema

async def send_signup_verification_email(email: EmailSchema):
    message = MessageSchema(
        subject='Your Alora verification code',
        recipients=email.recipients,
        template_body=email.body,
        subtype=MessageType.html
    )

    fm = FastMail(MAIL_CONFIG)
    await fm.send_message(message, template_name="signup_verification.jinja2")
    print(f"Email sent to {email.recipients}!")