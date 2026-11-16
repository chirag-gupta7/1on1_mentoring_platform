import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import async_session_factory
from app.models.user import User
from app.models.mentor_profile import MentorProfile
from app.models.student_profile import StudentProfile
from app.core.security import get_password_hash
from app.core.logger import logger

import uuid


async def seed_database():
    async with async_session_factory() as db:
        existing = await db.execute(
            __import__('sqlalchemy').select(User).limit(1)
        )
        if existing.scalar_one_or_none():
            logger.info("Database already seeded, skipping.")
            return

        mentor_id = uuid.uuid4()
        student_id = uuid.uuid4()

        mentor = User(
            id=mentor_id,
            email="mentor@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Dr. Jane Smith",
            role="mentor",
            is_verified=True,
        )
        student = User(
            id=student_id,
            email="student@example.com",
            password_hash=get_password_hash("password123"),
            full_name="John Doe",
            role="student",
            is_verified=True,
        )

        db.add_all([mentor, student])
        await db.flush()

        mentor_profile = MentorProfile(
            user_id=mentor_id,
            bio="Senior Software Engineer with 10+ years of experience in Python and System Design.",
            expertise=["python", "javascript", "system design", "dsa"],
            hourly_rate=50.00,
            rating=4.8,
            total_sessions=120,
        )
        student_profile = StudentProfile(
            user_id=student_id,
            education="B.Tech Computer Science",
            goals="Prepare for FAANG interviews and improve DSA skills",
            learning_preferences={"preferred_language": "python", "session_duration": 60},
        )

        db.add_all([mentor_profile, student_profile])
        await db.commit()

        logger.info("Database seeded with sample mentor and student accounts.")
        logger.info("Mentor: mentor@example.com / password123")
        logger.info("Student: student@example.com / password123")


if __name__ == "__main__":
    asyncio.run(seed_database())
