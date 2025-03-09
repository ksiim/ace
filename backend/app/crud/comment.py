from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.comment import Comment, CommentCreate


async def create_comment(*, session: AsyncSession, comment_create: CommentCreate) -> Comment:
    db_obj = Comment.model_validate(
        comment_create,
        update={
            "created_at": comment_create.created_at.replace(
                tzinfo=None
            )
        }
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_comment(*, session: AsyncSession, db_comment: Comment, comment_update: Comment) -> Comment:
    comment_data = comment_update.model_dump(exclude_unset=True)
    extra_data = {
        "created_at": comment_update.created_at.replace(tzinfo=None) if comment_update.created_at else None,
    }
    db_comment.sqlmodel_update(comment_data, update=extra_data)
    session.add(db_comment)
    await session.commit()
    await session.refresh(db_comment)
    return db_comment