from app.models.activity_log import ActivityLog


def log_activity(db, user_id, table_name, record_id, action_type, description):
    log = ActivityLog(
        user_id=user_id,
        table_name=table_name,
        record_id=record_id,
        action_type=action_type,
        description=description
    )
    db.add(log)