from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Assignment, Complaint, Department, Feedback, StatusUpdate, Student
from .serializers import (AssignmentSerializer, ComplaintSerializer, DepartmentSerializer,
                          FeedbackSerializer, StatusUpdateSerializer, StudentSerializer)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by("full_name")
    serializer_class = StudentSerializer
    search_fields = ["student_id", "full_name", "email"]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True).order_by("name")
    serializer_class = DepartmentSerializer
    search_fields = ["name", "description"]

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.select_related("student", "department").prefetch_related("assignments", "status_updates")
    serializer_class = ComplaintSerializer
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["student", "department", "status"]
    search_fields = ["title", "description", "student__full_name", "student__student_id", "department__name"]
    ordering_fields = ["created_at", "updated_at", "status"]

    @transaction.atomic
    def perform_create(self, serializer):
        complaint = serializer.save()
        StatusUpdate.objects.create(complaint=complaint, status=Complaint.Status.SUBMITTED, note="Complaint received")

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        complaint = self.get_object()
        return Response(StatusUpdateSerializer(complaint.status_updates.all(), many=True).data)

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("complaint").all()
    serializer_class = AssignmentSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        assignment = serializer.save()
        complaint = assignment.complaint
        complaint.status = Complaint.Status.ASSIGNED
        complaint.save(update_fields=["status", "updated_at"])
        StatusUpdate.objects.create(complaint=complaint, status=Complaint.Status.ASSIGNED,
                                    note=assignment.note or f"Assigned to {assignment.staff_name}",
                                    updated_by=assignment.staff_name)

class StatusUpdateViewSet(viewsets.ModelViewSet):
    queryset = StatusUpdate.objects.select_related("complaint").all()
    serializer_class = StatusUpdateSerializer
    http_method_names = ["get", "post", "head", "options"]

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related("complaint").all()
    serializer_class = FeedbackSerializer
    http_method_names = ["get", "post", "head", "options"]
