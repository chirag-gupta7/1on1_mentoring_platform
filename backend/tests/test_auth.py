import pytest
from httpx import AsyncClient


class TestAuth:
    @pytest.mark.asyncio
    async def test_register_student(self, client: AsyncClient):
        payload = {
            "email": "student@test.com",
            "password": "password123",
            "full_name": "Test Student",
            "role": "student",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_register_mentor(self, client: AsyncClient):
        payload = {
            "email": "mentor@test.com",
            "password": "password123",
            "full_name": "Test Mentor",
            "role": "mentor",
        }
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {
            "email": "dup@test.com",
            "password": "password123",
            "full_name": "Dup User",
            "role": "student",
        }
        resp1 = await client.post("/api/v1/auth/register", json=payload)
        assert resp1.status_code == 201

        resp2 = await client.post("/api/v1/auth/register", json=payload)
        assert resp2.status_code == 400
        assert "already registered" in resp2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        register_payload = {
            "email": "login@test.com",
            "password": "mypassword",
            "full_name": "Login User",
            "role": "student",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        login_payload = {"email": "login@test.com", "password": "mypassword"}
        resp = await client.post("/api/v1/auth/login", json=login_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        register_payload = {
            "email": "wrongpw@test.com",
            "password": "correctpw",
            "full_name": "Wrong PW",
            "role": "student",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        login_payload = {"email": "wrongpw@test.com", "password": "wrongpw"}
        resp = await client.post("/api/v1/auth/login", json=login_payload)
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me(self, client: AsyncClient):
        register_payload = {
            "email": "me@test.com",
            "password": "password123",
            "full_name": "Me User",
            "role": "mentor",
        }
        reg_resp = await client.post("/api/v1/auth/register", json=register_payload)
        token = reg_resp.json()["access_token"]

        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "me@test.com"
        assert data["full_name"] == "Me User"
        assert data["role"] == "mentor"

    @pytest.mark.asyncio
    async def test_get_me_unauthorized(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient):
        register_payload = {
            "email": "refresh@test.com",
            "password": "password123",
            "full_name": "Refresh User",
            "role": "student",
        }
        reg_resp = await client.post("/api/v1/auth/register", json=register_payload)
        refresh_token = reg_resp.json()["refresh_token"]

        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_forgot_password(self, client: AsyncClient):
        payload = {"email": "forgot@test.com"}
        resp = await client.post("/api/v1/auth/forgot-password", json=payload)
        assert resp.status_code == 200
