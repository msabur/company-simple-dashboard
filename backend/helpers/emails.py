from fastapi_mail import FastMail, MessageSchema, MessageType
from config import MAIL_CONFIG
from schemas import EmailDetails

fm = FastMail(MAIL_CONFIG)

async def send_signup_verification_email(email_details: EmailDetails):
    message = MessageSchema(
        subject='Your Alora verification code',
        recipients=email_details.recipients,
        template_body=email_details.body,
        subtype=MessageType.html
    )
    await fm.send_message(message, template_name="signup_verification.jinja2")

async def send_org_invite_email(email_details: EmailDetails):
    message = MessageSchema(
        subject='Organization Invite on Alora',
        recipients=email_details.recipients,
        template_body=email_details.body,
        subtype=MessageType.html
    )
    await fm.send_message(message, template_name="org_invite.jinja2")

async def send_password_reset_email(email_details: EmailDetails):
    message = MessageSchema(
        subject='Reset your Alora password',
        recipients=email_details.recipients,
        template_body=email_details.body,
        subtype=MessageType.html
    )
    await fm.send_message(message, template_name="password_reset.jinja2")
