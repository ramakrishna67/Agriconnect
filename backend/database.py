from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./agriconnect.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DiagnosisRecord(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String, nullable=False)
    disease = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String)
    image_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    rate = Column(String)
    location = Column(String)
    owner = Column(String)
    specs = Column(String)
    rating = Column(Float, default=4.5)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    user_name = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    contact = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ForumPost(Base):
    __tablename__ = "forum_posts"
    id = Column(Integer, primary_key=True, index=True)
    author = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text)
    category = Column(String)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    replies = relationship("ForumReply", back_populates="post")


class ForumReply(Base):
    __tablename__ = "forum_replies"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id"))
    author = Column(String, nullable=False)
    content = Column(Text)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    post = relationship("ForumPost", back_populates="replies")


class Expert(Base):
    __tablename__ = "experts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String)
    experience = Column(String)
    bio = Column(Text)
    rate = Column(String)
    rating = Column(Float, default=4.5)
    reviews = Column(Integer, default=0)
    available = Column(Boolean, default=True)


class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"))
    user_name = Column(String)
    date = Column(String)
    time = Column(String)
    topic = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
