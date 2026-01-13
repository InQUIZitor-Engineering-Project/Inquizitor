import logging

from celery.signals import task_failure, task_success

from app.infrastructure.monitoring.posthog_client import analytics

logger = logging.getLogger(__name__)

@task_success.connect
def on_task_success(sender=None, result=None, **kwargs):
    """
    General handler for successful tasks.
    sender is the task function.
    """
    task_name = getattr(sender, "name", "unknown")
    
    # We can add more specific logic here if needed
    if task_name == "app.tasks.process_material":
        # For this specific task, we've already handled capture inside the task
        # to get access to material properties. 
        # But we ensure a flush here.
        analytics.flush()

@task_failure.connect
def on_task_failure(
    sender=None,
    exception=None,
    task_id=None,
    args=None,
    kwargs=None,
    **kwargs_extra,
):
    """
    General handler for failed tasks.
    """
    task_name = getattr(sender, "name", "unknown")
    
    # Extract owner_id if possible (it's usually in args)
    # For material task: args=(job_id, owner_id, material_id)
    # For test generation: args=(job_id, owner_id, payload)
    user_id = "unknown"
    if args and len(args) > 1:
        user_id = str(args[1])

    analytics.capture(
        user_id=user_id,
        event="task_failed",
        properties={
            "task_name": task_name,
            "task_id": task_id,
            "error": str(exception),
            "exception_type": type(exception).__name__
        }
    )
    analytics.flush()

