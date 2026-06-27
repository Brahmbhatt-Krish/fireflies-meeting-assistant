from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ActionItem
from app.schemas.schemas import ActionItemResponse, ActionItemUpdate

router = APIRouter(prefix="/api/action-items", tags=["action-items"])


@router.patch("/{item_id}", response_model=ActionItemResponse)
def update_action_item(item_id: int, body: ActionItemUpdate, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    if body.text is not None:
        item.text = body.text
    if body.assignee is not None:
        item.assignee = body.assignee
    if body.completed is not None:
        item.completed = body.completed
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    db.delete(item)
    db.commit()
