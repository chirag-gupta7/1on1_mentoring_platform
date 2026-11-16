import pytest
from httpx import AsyncClient


@pytest.fixture
async def mentor_token(client: AsyncClient) -> str:
    payload = {
        "email": "mentor_sess@test.com",
        "password": "password123",
        "full_name": "Mentor Sessions",
        "role": "mentor",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    return resp.json()["access_token"]


@pytest.fixture
async def student_token(client: AsyncClient) -> str:
    payload = {
        "email": "student_sess@test.com",
        "password": "password123",
        "full_name": "Student Sessions",
        "role": "student",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    return resp.json()["access_token"]


class TestSessions:
    @pytest.mark.asyncio
    async def test_create_session(self, client: AsyncClient, mentor_token: str):
        payload = {
            "title": "DSA Prep",
            "description": "Leetcode practice",
            "language": "Python",
            "start_time": "2026-07-01T10:00:00Z",
        }
        resp = await client.post(
            "/api/v1/sessions/",
            json=payload,
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "DSA Prep"
        assert data["language"] == "Python"
        assert data["status"] in ("created", "scheduled")

    @pytest.mark.asyncio
    async def test_create_session_unauthorized(self, client: AsyncClient):
        payload = {
            "title": "Unauthorized Session",
            "language": "Python",
            "start_time": "2026-07-01T10:00:00Z",
        }
        resp = await client.post("/api/v1/sessions/", json=payload)
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_get_my_sessions(self, client: AsyncClient, mentor_token: str):
        for i in range(3):
            await client.post(
                "/api/v1/sessions/",
                json={
                    "title": f"Session {i}",
                    "language": "Python",
                    "start_time": "2026-07-01T10:00:00Z",
                },
                headers={"Authorization": f"Bearer {mentor_token}"},
            )

        resp = await client.get(
            "/api/v1/sessions/my",
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_join_session(self, client: AsyncClient, mentor_token: str, student_token: str):
        create_resp = await client.post(
            "/api/v1/sessions/",
            json={
                "title": "Join Test",
                "language": "JavaScript",
                "start_time": "2026-07-01T10:00:00Z",
            },
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        session_id = create_resp.json()["id"]

        resp = await client.post(
            f"/api/v1/sessions/{session_id}/join",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_end_session(self, client: AsyncClient, mentor_token: str):
        create_resp = await client.post(
            "/api/v1/sessions/",
            json={
                "title": "End Test",
                "language": "Python",
                "start_time": "2026-07-01T10:00:00Z",
            },
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        session_id = create_resp.json()["id"]

        resp = await client.post(
            f"/api/v1/sessions/{session_id}/end",
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    @pytest.mark.asyncio
    async def test_cancel_session(self, client: AsyncClient, mentor_token: str):
        create_resp = await client.post(
            "/api/v1/sessions/",
            json={
                "title": "Cancel Test",
                "language": "Python",
                "start_time": "2026-07-01T10:00:00Z",
            },
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        session_id = create_resp.json()["id"]

        resp = await client.post(
            f"/api/v1/sessions/{session_id}/cancel",
            headers={"Authorization": f"Bearer {mentor_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"
