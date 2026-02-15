# Inventory Export Format

The inventory export is a JSON file containing all locations, sublocations, and items. It can be downloaded from the ellipsis menu on the `/inventory` page.

## Structure

The export is an array of location objects, each containing nested sublocations and items:

```json
[
  {
    "id": 1,
    "name": "Kitchen",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z",
    "sublocations": [
      {
        "id": 1,
        "name": "Under Sink",
        "photoPath": "sublocation-1-1234567890.jpg",
        "locationId": 1,
        "createdAt": "2025-01-15T12:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z",
        "items": [
          {
            "id": 1,
            "name": "Dish Soap",
            "description": "Dawn Ultra",
            "categoryTag": "Cleaning",
            "quantity": 2,
            "sublocationId": 1,
            "createdAt": "2025-01-15T12:00:00.000Z",
            "updatedAt": "2025-01-15T12:00:00.000Z"
          }
        ]
      }
    ]
  }
]
```

## Field Reference

### Location

| Field | Type | Description |
|---|---|---|
| `id` | integer | Primary key |
| `name` | string | Unique location name |
| `createdAt` | ISO 8601 datetime | Creation timestamp |
| `updatedAt` | ISO 8601 datetime | Last update timestamp |
| `sublocations` | array | Nested sublocation objects |

### Sublocation

| Field | Type | Description |
|---|---|---|
| `id` | integer | Primary key |
| `name` | string | Sublocation name (unique within its location) |
| `photoPath` | string or null | Filename of uploaded photo |
| `locationId` | integer | Foreign key to parent location |
| `createdAt` | ISO 8601 datetime | Creation timestamp |
| `updatedAt` | ISO 8601 datetime | Last update timestamp |
| `items` | array | Nested inventory item objects |

### InventoryItem

| Field | Type | Description |
|---|---|---|
| `id` | integer | Primary key |
| `name` | string | Item name |
| `description` | string or null | Optional description |
| `categoryTag` | string or null | Optional category tag |
| `quantity` | integer | Item count (default: 1) |
| `sublocationId` | integer | Foreign key to parent sublocation |
| `createdAt` | ISO 8601 datetime | Creation timestamp |
| `updatedAt` | ISO 8601 datetime | Last update timestamp |
