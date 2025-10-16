import pytest
from fastapi.testclient import TestClient
from src.app import app

# Create test client
client = TestClient(app)

def test_read_root():
    """Test the root endpoint redirects to index.html"""
    response = client.get("/")
    assert response.status_code == 200 or response.status_code == 307

def test_get_activities():
    """Test retrieving all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert len(activities) > 0
    
    # Check structure of an activity
    first_activity = next(iter(activities.values()))
    assert "description" in first_activity
    assert "schedule" in first_activity
    assert "max_participants" in first_activity
    assert "participants" in first_activity
    assert isinstance(first_activity["participants"], list)

def test_signup_for_activity():
    """Test signing up for an activity"""
    # Get first activity name
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Try to sign up
    email = "test_student@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    assert "message" in response.json()
    assert email in response.json()["message"]
    
    # Verify participant was added
    updated_activity = client.get("/activities").json()[activity_name]
    assert email in updated_activity["participants"]

def test_duplicate_signup():
    """Test that a student cannot sign up twice for the same activity"""
    # Get first activity name
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Sign up first time
    email = "duplicate_test@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    
    # Try to sign up again
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()

def test_unregister_from_activity():
    """Test unregistering from an activity"""
    # Get first activity name
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # First sign up
    email = "unregister_test@mergington.edu"
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Then unregister
    response = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    assert "message" in response.json()
    assert email in response.json()["message"]
    
    # Verify participant was removed
    updated_activity = client.get("/activities").json()[activity_name]
    assert email not in updated_activity["participants"]

def test_activity_not_found():
    """Test error handling for non-existent activity"""
    response = client.post("/activities/non_existent_activity/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_activity_participants():
    """Test getting participants for an activity"""
    # Get first activity name
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Get participants
    response = client.get(f"/activities/{activity_name}/participants")
    assert response.status_code == 200
    participants = response.json()
    assert isinstance(participants, list)
    
    # Verify it matches the activity data
    activity = activities[activity_name]
    assert set(participants) == set(activity["participants"])