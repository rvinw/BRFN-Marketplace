from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Address, CustomerProfile, ProducerProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "phone", "role_name"]


class CustomerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)

    customer_type = serializers.ChoiceField(
        choices=CustomerProfile.CustomerType.choices
    )
    org_name = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )

    line_1 = serializers.CharField()
    line_2 = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    city = serializers.CharField()
    postcode = serializers.CharField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        address = Address.objects.create(
            line_1=validated_data["line_1"],
            line_2=validated_data.get("line_2"),
            city=validated_data["city"],
            postcode=validated_data["postcode"],
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            phone=validated_data.get("phone"),
            role_name=User.Role.CUSTOMER,
        )

        CustomerProfile.objects.create(
            user=user,
            customer_type=validated_data["customer_type"],
            org_name=validated_data.get("org_name"),
            address=address,
        )

        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data


class ProducerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)

    business_name = serializers.CharField()
    contact_name = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    lead_time_hours = serializers.IntegerField(
        required=False, default=48, min_value=0
    )

    line_1 = serializers.CharField()
    line_2 = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    city = serializers.CharField()
    postcode = serializers.CharField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        address = Address.objects.create(
            line_1=validated_data["line_1"],
            line_2=validated_data.get("line_2"),
            city=validated_data["city"],
            postcode=validated_data["postcode"],
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            phone=validated_data.get("phone"),
            role_name=User.Role.PRODUCER,
        )

        ProducerProfile.objects.create(
            user=user,
            business_name=validated_data["business_name"],
            contact_name=validated_data.get("contact_name"),
            address=address,
            lead_time_hours=validated_data.get("lead_time_hours", 48),
        )

        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data