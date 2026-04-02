from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Equipment as EquipmentModel, Booking as BookingModel
from schemas import EquipmentCreate, BookingCreate

router = APIRouter(prefix="/api/equipment", tags=["Equipment Sharing"])

SAMPLE_EQUIPMENT = [
    {"id": 1, "name": "John Deere Tractor 5050D", "type": "Tractor", "rate": "₹1,500/day", "location": "Pune, Maharashtra", "owner": "Rajesh Kumar", "rating": 4.8, "available": True, "specs": "50 HP, 4WD"},
    {"id": 2, "name": "Mahindra Rotavator", "type": "Tillage", "rate": "₹800/day", "location": "Nashik, Maharashtra", "owner": "Sunil Patil", "rating": 4.5, "available": True, "specs": "42 Blades, 5ft"},
    {"id": 3, "name": "Crop Sprayer - Boom Type", "type": "Sprayer", "rate": "₹500/day", "location": "Nagpur, Maharashtra", "owner": "Amit Deshmukh", "rating": 4.7, "available": False, "specs": "500L, 12m Boom"},
    {"id": 4, "name": "Combine Harvester", "type": "Harvester", "rate": "₹3,000/day", "location": "Indore, MP", "owner": "Vikram Singh", "rating": 4.9, "available": True, "specs": "14ft Header, GPS"},
    {"id": 5, "name": "Seed Drill Machine", "type": "Seeder", "rate": "₹600/day", "location": "Jaipur, Rajasthan", "owner": "Mohan Sharma", "rating": 4.3, "available": True, "specs": "9 Row"},
    {"id": 6, "name": "Water Pump - 5HP", "type": "Irrigation", "rate": "₹300/day", "location": "Lucknow, UP", "owner": "Ramesh Yadav", "rating": 4.6, "available": True, "specs": "5HP Diesel"},
]


@router.get("")
async def list_equipment(type: str = None):
    """List all available equipment, optionally filtered by type"""
    items = SAMPLE_EQUIPMENT
    if type and type != "All":
        items = [e for e in items if e["type"] == type]
    return {"equipment": items}


@router.post("")
async def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    """List new equipment for sharing"""
    db_equip = EquipmentModel(**equipment.dict())
    db.add(db_equip)
    db.commit()
    db.refresh(db_equip)
    return {"message": "Equipment listed successfully", "id": db_equip.id}


@router.post("/{equipment_id}/book")
async def book_equipment(equipment_id: int, booking: BookingCreate, db: Session = Depends(get_db)):
    """Book an equipment"""
    db_booking = BookingModel(equipment_id=equipment_id, **booking.dict())
    db.add(db_booking)
    db.commit()
    return {"message": "Equipment booked successfully", "booking_id": db_booking.id}
