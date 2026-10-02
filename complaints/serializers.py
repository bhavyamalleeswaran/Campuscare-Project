from rest_framework import serializers
from .models import Assignment, Complaint, Department, Feedback, StatusUpdate, Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "student_id", "full_name", "email", "course", "year_of_study", "created_at"]
        read_only_fields = ["id", "created_at"]

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "description", "email", "is_active"]

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "complaint", "staff_name", "note", "assigned_at"]
        read_only_fields = ["id", "assigned_at"]

class StatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusUpdate
        fields = ["id", "complaint", "status", "note", "updated_by", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        update = super().create(validated_data)
        complaint = update.complaint
        complaint.status = update.status
        complaint.save(update_fields=["status", "updated_at"])
        return update

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["id", "complaint", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_complaint(self, complaint):
        if complaint.status != Complaint.Status.RESOLVED:
            raise serializers.ValidationError("Feedback is available after a complaint is resolved.")
        return complaint

class ComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_code = serializers.CharField(source="student.student_id", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    assignee_name = serializers.SerializerMethodField()
    status_updates = StatusUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = ["id", "student", "student_name", "student_code", "department", "department_name",
                  "title", "description", "status", "created_at", "updated_at", "assignee_name", "status_updates"]
        read_only_fields = ["id", "status", "created_at", "updated_at", "status_updates"]

    def get_assignee_name(self, complaint):
        assignment = complaint.assignments.first()
        return assignment.staff_name if assignment else ""
