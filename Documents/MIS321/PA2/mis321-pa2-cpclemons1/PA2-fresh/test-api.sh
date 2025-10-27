#!/bin/bash

echo "=== Testing FreelanceMusic API ==="
echo ""

# Test 1: Create a teacher account
echo "1. Creating teacher account..."
curl -X POST http://localhost:5000/api/teacher/create \
  -H "Content-Type: application/json" \
  -d '{"Name":"Test Teacher","Instrument":"Guitar","Email":"teacher@test.com","HourlyRate":50.0,"Availability":"Mon-Fri 9-5"}' \
  | jq '.'

echo ""
echo "Press Enter to continue..."
read

# Test 2: Create a student account  
echo "2. Creating student account..."
curl -X POST http://localhost:5000/api/student/create \
  -H "Content-Type: application/json" \
  -d '{"Name":"Test Student","Email":"student@test.com","Phone":"555-1234","Instrument":"Guitar"}' \
  | jq '.'

echo ""
echo "Press Enter to continue..."
read

# Test 3: Schedule a lesson
echo "3. Scheduling a lesson..."
curl -X POST http://localhost:5000/api/teacher/schedule \
  -H "Content-Type: application/json" \
  -d '{"TeacherId":1,"Instrument":"Guitar","LessonType":"virtual","TimeSlot":"2024-12-01 10:00","Price":50.0}' \
  | jq '.'

echo ""
echo "Press Enter to continue..."
read

# Test 4: Verify card (with valid card)
echo "4. Verifying valid card..."
curl -X POST http://localhost:5000/api/student/verify-card \
  -H "Content-Type: application/json" \
  -d '{"CardNumber":"4532015112830366","ExpiryDate":"12/25","CVV":"123"}' \
  | jq '.'

echo ""
echo "Press Enter to continue..."
read

# Test 5: Verify card (invalid - expired)
echo "5. Verifying expired card (should fail)..."
curl -X POST http://localhost:5000/api/student/verify-card \
  -H "Content-Type: application/json" \
  -d '{"CardNumber":"4532015112830366","ExpiryDate":"01/20","CVV":"123"}' \
  | jq '.'

echo ""
echo "Test complete!"
