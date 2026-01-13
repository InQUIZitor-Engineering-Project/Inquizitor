from sqladmin import ModelView

from app.db.models import (
    File,
    Job,
    Material,
    Question,
    SupportTicket,
    SystemNotification,
    Test,
    User,
)


class UserAdmin(ModelView, model=User):
    column_list = ["id", "email", "first_name", "last_name", "created_at"]
    column_searchable_list = ["email", "first_name", "last_name"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-user"
    name_plural = "Użytkownicy"


class TestAdmin(ModelView, model=Test):
    column_list = ["id", "title", "owner_id", "created_at"]
    column_searchable_list = ["title"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-file-lines"
    name_plural = "Testy"


class QuestionAdmin(ModelView, model=Question):
    column_list = ["id", "test_id", "text", "difficulty"]
    column_searchable_list = ["text"]
    icon = "fa-solid fa-question"
    name_plural = "Pytania"


class MaterialAdmin(ModelView, model=Material):
    column_list = [
        "id",
        "owner_id",
        "mime_type",
        "processing_status",
        "created_at",
    ]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-book"
    name_plural = "Materiały"


class FileAdmin(ModelView, model=File):
    column_list = ["id", "filename", "owner_id", "uploaded_at"]
    icon = "fa-solid fa-file"
    name_plural = "Pliki"


class JobAdmin(ModelView, model=Job):
    column_list = ["id", "owner_id", "job_type", "status", "created_at"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-gears"
    name_plural = "Zadania (Background Jobs)"


class SupportTicketAdmin(ModelView, model=SupportTicket):
    column_list = [
        "id",
        "email",
        "subject",
        "status",
        "created_at",
    ]
    column_searchable_list = ["email", "subject"]
    column_sortable_list = ["id", "created_at"]
    icon = "fa-solid fa-headset"
    name_plural = "Zgłoszenia Support"


class NotificationAdmin(ModelView, model=SystemNotification):
    column_list = [
        "id",
        "title",
        "type",
        "created_at",
    ]
    icon = "fa-solid fa-bell"
    name_plural = "Powiadomienia Systemowe"


def setup_admin_views(admin):
    admin.add_view(UserAdmin)
    admin.add_view(TestAdmin)
    admin.add_view(QuestionAdmin)
    admin.add_view(MaterialAdmin)
    admin.add_view(FileAdmin)
    admin.add_view(JobAdmin)
    admin.add_view(SupportTicketAdmin)
    admin.add_view(NotificationAdmin)
