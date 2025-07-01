from dotenv import load_dotenv
load_dotenv()

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from main import app

class TestAuth:
    session: Session
    client: TestClient

    @classmethod
    def setup_class(cls):
        # ensure tables exist and set up a session
        Base.metadata.create_all(engine)
        cls.session = SessionLocal()
        cls.client = TestClient(app)
        pass

    @classmethod
    def teardown_class(cls):
        # rollback the session and close it
        cls.session.rollback()
        cls.session.close()
    
    def test_failed_login(self):
        # try to log in with non-existent credentials
        response = self.client.post(
            '/login',
            json={
                "email": "random_nonexistent_email283841@mail.ru",
                "password": "pswrd",
            }
        )
        assert response.status_code == 401
    
    def test_signup_and_login(self):
        email = "laisfjewilj34890jdfs@mail.ru"
        password = "oifwejf(*#$fjd!)"
        response = self.client.post(
            "/signup",
            json={
                "email": email,
                "full_name": "random user",
                "username": email,
                "password": password,
            }
        )
        assert response.status_code == 200

        response = self.client.post(
            '/login',
            json={
                "email": email,
                "password": password,
            }
        )
        assert response.status_code == 200

    def test_signup_duplicate(self):
        email = "duplicate_test@mail.ru"
        password = "testpass123"
        # First signup should succeed
        response = self.client.post(
            "/signup",
            json={
                "email": email,
                "full_name": "User One",
                "username": email,
                "password": password,
            }
        )
        assert response.status_code == 200
        # Second signup with same email should fail
        response = self.client.post(
            "/signup",
            json={
                "email": email,
                "full_name": "User Two",
                "username": email,
                "password": password,
            }
        )
        assert response.status_code == 400

    def test_signup_and_login_wrong_password(self):
        email = "wrongpass@mail.ru"
        password = "rightpass"
        self.client.post(
            "/signup",
            json={
                "email": email,
                "full_name": "User WrongPass",
                "username": email,
                "password": password,
            }
        )
        # Try wrong password
        response = self.client.post(
            "/login",
            json={
                "email": email,
                "password": "wrongpass",
            }
        )
        assert response.status_code == 401

    def test_signup_and_login_case_insensitive_email(self):
        email = "caseinsensitive@mail.ru"
        password = "casepass"
        self.client.post(
            "/signup",
            json={
                "email": email,
                "full_name": "Case User",
                "username": email,
                "password": password,
            }
        )
        # Try login with uppercase email
        response = self.client.post(
            "/login",
            json={
                "email": email.upper(),
                "password": password,
            }
        )
        # Accept 200 if your backend is case-insensitive, else 401
        assert response.status_code == 401
