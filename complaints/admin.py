from django.contrib import admin
from .models import Assignment, Complaint, Department, Feedback, StatusUpdate, Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_id", "full_name", "email", "course", "year_of_study")
    search_fields = ("student_id", "full_name", "email")

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)

class StatusUpdateInline(admin.TabularInline):
    model = StatusUpdate
    extra = 0
    readonly_fields = ("created_at",)

class AssignmentInline(admin.TabularInline):
    model = Assignment
    extra = 0

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "student", "department", "status", "created_at")
    list_filter = ("status", "department", "created_at")
    search_fields = ("title", "description", "student__student_id", "student__full_name")
    readonly_fields = ("created_at", "updated_at")
    inlines = (AssignmentInline, StatusUpdateInline)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("complaint", "staff_name", "assigned_at")
    search_fields = ("staff_name", "complaint__title")

@admin.register(StatusUpdate)
class StatusUpdateAdmin(admin.ModelAdmin):
    list_display = ("complaint", "status", "updated_by", "created_at")
    list_filter = ("status", "created_at")

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("complaint", "rating", "created_at")
    list_filter = ("rating",)
