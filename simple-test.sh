#!/bin/bash

echo "🧪 SIMPLE ENGLISH-ONLY TESTING"
echo "==============================="

BASE_URL="http://localhost:3000/api/v1/leads"

echo ""
echo "1. ✅ Valid English shop name:"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Premium Nuts Store", "location": "Riyadh King Fahd District", "contactName": "Ahmed Al-Rashid", "phone": "+966501234567"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "2. ❌ Arabic text (should fail):"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "محل الجوز", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501234568"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "3. ❌ Mixed Arabic-English (should fail):"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Al Nuts محل", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501234569"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "4. ✅ English with numbers (should work):"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Nuts Store 2024", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501234570"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "5. ❌ Emoji (should fail):"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Al Nuts Store 🥜", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501234571"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "6. ✅ English with special chars (should work):"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Al-Nuts & Sons Co.", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501234572"}' \
-w " | Status: %{http_code}\n"

echo ""
echo "==============================="
echo "Expected Results:"
echo "✅ Tests 1, 4, 6 should return Status: 201"
echo "❌ Tests 2, 3, 5 should return Status: 400" 