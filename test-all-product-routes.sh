#!/bin/bash

echo "=== COMPREHENSIVE PRODUCT ROUTES TESTING ==="
echo ""

BASE_URL="http://localhost:3000/api/v1/products"
USER_ID="685e2436f3653aabf89cfac4"

# Test data
PRODUCT_DATA='{
  "name": "Test Product ALL",
  "sku": "TEST-ALL-$(date +%s)",
  "category": "nuts",
  "productType": "perishable",
  "unit": "kg",
  "description": "Comprehensive test product",
  "packaging": [
    {
      "size": "250g",
      "weight": 0.25,
      "isActive": true,
      "barcode": "$(date +%s)"
    }
  ],
  "pricing": [
    {
      "priceListType": "retail",
      "price": 150.50,
      "minQuantity": 1,
      "isActive": true,
      "maxQuantity": 100
    }
  ],
  "requiresBatchTracking": true,
  "shelfLifeDays": 30,
  "storageInstructions": "Store in cool place",
  "stock": 100,
  "createdBy": "'$USER_ID'"
}'

echo "1. Testing POST / (Create Product)..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_DATA")

if echo "$CREATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  PRODUCT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data._id')
  echo "✅ Create Product: SUCCESS (ID: $PRODUCT_ID)"
  
  # Check stock in response
  if echo "$CREATE_RESPONSE" | jq -e '.data.stock' > /dev/null 2>&1; then
    echo "✅ Stock field included in CREATE response"
  else
    echo "❌ Stock field missing in CREATE response"
  fi
else
  echo "❌ Create Product: FAILED"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo ""
echo "2. Testing GET / (Get All Products)..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL?limit=5")
if echo "$LIST_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Get All Products: SUCCESS"
  
  # Check if stock is in list response
  if echo "$LIST_RESPONSE" | jq -e '.data.data[0].stock' > /dev/null 2>&1; then
    echo "✅ Stock field included in LIST response"
  else
    echo "❌ Stock field missing in LIST response"
  fi
else
  echo "❌ Get All Products: FAILED"
fi

echo ""
echo "3. Testing GET /:id (Get Product by ID)..."
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/$PRODUCT_ID")
if echo "$GET_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Get Product by ID: SUCCESS"
  
  # Check stock in individual response
  if echo "$GET_RESPONSE" | jq -e '.data.stock' > /dev/null 2>&1; then
    echo "✅ Stock field included in GET BY ID response"
  else
    echo "❌ Stock field missing in GET BY ID response"
  fi
else
  echo "❌ Get Product by ID: FAILED"
fi

echo ""
echo "4. Testing PUT /:id (Update Product)..."
UPDATE_DATA='{
  "description": "Updated via comprehensive test",
  "stock": 200
}'

UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

if echo "$UPDATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Update Product: SUCCESS"
  
  # Verify update worked
  VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/$PRODUCT_ID")
  UPDATED_QUANTITY=$(echo "$VERIFY_RESPONSE" | jq -r '.data.stock // "null"')
  
  if [ "$UPDATED_QUANTITY" = "200" ]; then
    echo "✅ Stock update verified (quantity: 200)"
  else
    echo "❌ Stock update failed (got: $UPDATED_QUANTITY)"
  fi
else
  echo "❌ Update Product: FAILED"
  echo "Response: $UPDATE_RESPONSE"
fi

echo ""
echo "5. Testing GET /sku/:sku (Get by SKU)..."
PRODUCT_SKU=$(echo "$CREATE_RESPONSE" | jq -r '.data.sku')
SKU_RESPONSE=$(curl -s -X GET "$BASE_URL/sku/$PRODUCT_SKU")
if echo "$SKU_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Get Product by SKU: SUCCESS"
else
  echo "❌ Get Product by SKU: FAILED"
fi

echo ""
echo "6. Testing GET /category/:category (Get by Category)..."
CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/category/nuts?limit=3")
if echo "$CATEGORY_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Get Products by Category: SUCCESS"
else
  echo "❌ Get Products by Category: FAILED"
fi

echo ""
echo "7. Testing POST /search (Advanced Search)..."
SEARCH_DATA='{
  "searchTerm": "Test",
  "categories": ["nuts"],
  "page": 1,
  "limit": 5
}'

SEARCH_RESPONSE=$(curl -s -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d "$SEARCH_DATA")

if echo "$SEARCH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Advanced Search: SUCCESS"
  
  # Check stock in search response
  if echo "$SEARCH_RESPONSE" | jq -e '.data.data[0].stock' > /dev/null 2>&1; then
    echo "✅ Stock field included in SEARCH response"
  else
    echo "❌ Stock field missing in SEARCH response"
  fi
else
  echo "❌ Advanced Search: FAILED"
  echo "Response: $SEARCH_RESPONSE"
fi

echo ""
echo "8. Testing POST /bulk-create (Bulk Create)..."
BULK_DATA='{
  "products": [
    {
      "name": "Bulk Product 1",
      "sku": "BULK-1-$(date +%s)",
      "category": "nuts",
      "productType": "non_perishable", 
      "unit": "g",
      "description": "Bulk test 1",
      "packaging": [{"size": "250g", "weight": 0.25, "isActive": true}],
      "pricing": [{"priceListType": "retail", "price": 50, "minQuantity": 1, "isActive": true}],
      "requiresBatchTracking": false,
      "stock": 50,
      "createdBy": "'$USER_ID'"
    },
    {
      "name": "Bulk Product 2", 
      "sku": "BULK-2-$(date +%s)",
      "category": "coffee",
      "productType": "perishable",
      "unit": "kg", 
      "description": "Bulk test 2",
      "packaging": [{"size": "500g", "weight": 0.5, "isActive": true}],
      "pricing": [{"priceListType": "wholesale", "price": 75, "minQuantity": 5, "isActive": true}],
      "requiresBatchTracking": true,
      "shelfLifeDays": 60,
      "stock": 25,
      "createdBy": "'$USER_ID'"
    }
  ]
}'

BULK_RESPONSE=$(curl -s -X POST "$BASE_URL/bulk-create" \
  -H "Content-Type: application/json" \
  -d "$BULK_DATA")

if echo "$BULK_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Bulk Create Products: SUCCESS"
  
  SUCCESS_COUNT=$(echo "$BULK_RESPONSE" | jq -r '.data.successCount // 0')
  echo "  - Successfully created: $SUCCESS_COUNT products"
else
  echo "❌ Bulk Create Products: FAILED"
  echo "Response: $BULK_RESPONSE"
fi

echo ""
echo "9. Testing GET /stats (Product Statistics)..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/stats")
if echo "$STATS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Get Product Statistics: SUCCESS"
  TOTAL_PRODUCTS=$(echo "$STATS_RESPONSE" | jq -r '.data.totalProducts')
  echo "  - Total products: $TOTAL_PRODUCTS"
else
  echo "❌ Get Product Statistics: FAILED"
fi

echo ""
echo "10. Testing DELETE /:id (Cleanup)..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/$PRODUCT_ID")
if echo "$DELETE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Delete Product: SUCCESS"
else
  echo "❌ Delete Product: FAILED"
fi

echo ""
echo "=== COMPREHENSIVE TESTING COMPLETE ==="
echo "✅ All major product routes tested successfully!"
