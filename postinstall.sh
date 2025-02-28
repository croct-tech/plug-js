#!/bin/sh

# Define the directory where the test files should be created
CONTENT_DIR="node_modules/@croct/content/slot"
EN_CONTENT='{"title":"Hello, World!"}'
ES_CONTENT='{"title":"¡Hola, Mundo!"}'
SLOT_ID="test"

rm -rf "$CONTENT_DIR"
mkdir -p "$CONTENT_DIR"
mkdir -p "$CONTENT_DIR/en"
mkdir -p "$CONTENT_DIR/es"

echo "$EN_CONTENT" > "$CONTENT_DIR/en/$SLOT_ID.json"
echo "$EN_CONTENT" > "$CONTENT_DIR/$SLOT_ID.json"
echo "$ES_CONTENT" > "$CONTENT_DIR/es/$SLOT_ID.json"
