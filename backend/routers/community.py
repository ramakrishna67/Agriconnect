from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ForumPost, ForumReply
from schemas import PostCreate, ReplyCreate

router = APIRouter(prefix="/api/community", tags=["Community Forum"])

SAMPLE_POSTS = [
    {"id": 1, "author": "Rajesh Kumar", "title": "Best practices for organic tomato farming?", "content": "Planning to start organic tomato farming. What are the best practices?", "category": "Organic Farming", "time": "2 hours ago", "likes": 24, "replies_count": 2},
    {"id": 2, "author": "Sunil Patil", "title": "Dealing with water scarcity - drip irrigation tips", "content": "Our region is facing water shortage. Looking for drip irrigation advice.", "category": "Irrigation", "time": "5 hours ago", "likes": 31, "replies_count": 1},
    {"id": 3, "author": "Lakshmi Devi", "title": "Success with intercropping maize and beans", "content": "Intercropping increased my yield by 30%! Happy to answer questions.", "category": "Crop Management", "time": "1 day ago", "likes": 56, "replies_count": 0},
]


@router.get("/posts")
async def get_posts(category: str = None):
    """Get forum posts, optionally filtered by category"""
    posts = SAMPLE_POSTS
    if category and category != "All":
        posts = [p for p in posts if p["category"] == category]
    return {"posts": posts}


@router.post("/posts")
async def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """Create a new forum post"""
    db_post = ForumPost(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return {"message": "Post created successfully", "id": db_post.id}


@router.post("/posts/{post_id}/reply")
async def reply_to_post(post_id: int, reply: ReplyCreate, db: Session = Depends(get_db)):
    """Reply to a forum post"""
    db_reply = ForumReply(post_id=post_id, **reply.dict())
    db.add(db_reply)
    db.commit()
    return {"message": "Reply posted successfully", "id": db_reply.id}


@router.get("/categories")
async def get_categories():
    """Get forum categories"""
    return {"categories": ["Organic Farming", "Irrigation", "Crop Management", "Government Schemes", "Market Discussion", "Equipment"]}
