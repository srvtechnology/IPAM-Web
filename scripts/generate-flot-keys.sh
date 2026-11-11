#!/usr/bin/env bash
set -e

# Flot RSA-4096 Key Generation Script
# As specified in the Flot Merchant Integration Guide (Section 02, Step 03)

OUTPUT_DIR="${1:-keys/flot}"
mkdir -p "$OUTPUT_DIR"

echo "Generating RSA-4096 private key in $OUTPUT_DIR/private_key.pem..."
openssl genpkey -algorithm RSA -out "$OUTPUT_DIR/private_key.pem" -pkeyopt rsa_keygen_bits:4096
chmod 600 "$OUTPUT_DIR/private_key.pem"

echo "Extracting matching public key to $OUTPUT_DIR/public_key.pem..."
openssl rsa -pubout -in "$OUTPUT_DIR/private_key.pem" -out "$OUTPUT_DIR/public_key.pem"

echo "Generating Base64-encoded version of public key to $OUTPUT_DIR/public_key.base64..."
openssl base64 -in "$OUTPUT_DIR/public_key.pem" -out "$OUTPUT_DIR/public_key.base64"
cat "$OUTPUT_DIR/public_key.pem" | base64 | tr -d '\r\n' > "$OUTPUT_DIR/public_key.base64.single"

echo ""
echo "================================================================="
echo "✅ RSA-4096 Keys generated successfully!"
echo "Private Key: $OUTPUT_DIR/private_key.pem (KEEP CONFIDENTIAL)"
echo "Public Key:  $OUTPUT_DIR/public_key.pem"
echo "Base64 Key:  $OUTPUT_DIR/public_key.base64 (SHARE WITH FLOT STAFF)"
echo "================================================================="

