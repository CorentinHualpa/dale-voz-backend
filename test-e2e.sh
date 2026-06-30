#!/bin/bash

echo "Testing Dale Voz E2E..."

# Health check
echo ""
echo "1. Health check dale-voz:"
curl -s http://localhost:3000/health | jq '.'

# Health check nova-core
echo ""
echo "2. Health check nova-core:"
curl -s http://localhost:3001/health | jq '.'

# Create a test client in DB (you'll need to implement a seed endpoint or do this manually)
echo ""
echo "3. Creating test client..."
# This would require a POST /api/admin/clients endpoint (not yet implemented)
# For now, manually create in Prisma Studio or DB

# Test sending a WhatsApp message simulation
echo ""
echo "4. Simulating WhatsApp message (would be actual webhook in production):"
echo "   - In production: Meta sends webhook to /api/whatsapp/webhook"
echo "   - For testing: create booking manually in Prisma Studio"

# Check DB via Prisma Studio
echo ""
echo "5. Viewing database:"
echo "   Run: npx prisma studio"
echo "   Then browse clients, bookings, conversations"

echo ""
echo "✓ E2E test guide complete"
echo ""
echo "Next steps:"
echo "  1. Create a test client in Prisma Studio"
echo "  2. Send real WhatsApp message via Meta Business testing"
echo "  3. Verify webhook received + booking created"
