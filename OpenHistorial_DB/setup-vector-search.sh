#!/bin/bash

# create text embedding pipeline for reindexing
curl \
  --request PUT \
  --header "Content-Type: application/json" \
  --data '{
    "description": "Text embedding pipeline",
    "processors": [
      {
        "inference": {
          "model_id": "sentence-transformers__msmarco-minilm-l12-cos-v5",
          "target_field": "text_embedding",
          "field_map": {
            "text": "text_field"
          }
        }
      }
    ],
    "on_failure": [
      {
        "set": {
          "description": "Failed to reindex document",
          "field": "_index",
          "value": "failed-{{{_index}}}"
        }
      },
      {
        "set": {
          "description": "Set error message",
          "field": "ingest.failure",
          "value": "{{_ingest.on_failure_message}}"
        }
      }
    ]
  }' \
  http://localhost:9200/_ingest/pipeline/text-embeddings

# create new index mappings
curl \
  --request PUT \
  --header "Content-Type: application/json" \
  --data '{
    "mappings": {
      "properties": {
        "text_embedding.predicted_value": {
          "type": "dense_vector"
        },
        "id" : {
          "type": "long"
        },
        "text": {
          "type": "text"
        },
        "num_of_pages": {
          "type": "byte"
        },
        "year": {
          "type": "short"
        },
        "doc_type": {
          "type": "keyword"
        }
      }
    }
  }' \
  http://localhost:9200/document-with-vector

# start reindex in background
curl \
  --request POST \
  --header "Content-Type: application/json" \
  --data '{
    "source": {
      "index": "document"
    },
    "dest": {
      "index": "document-with-vector",
      "pipeline": "text-embeddings"
    }
  }' \
  http://localhost:9200/_reindex?wait_for_completion=false
