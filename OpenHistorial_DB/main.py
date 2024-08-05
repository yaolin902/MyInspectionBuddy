import logging, requests
from flask import Flask, request, jsonify

app = Flask(__name__)


# GET /document-with-vector/_search
# {
#   "query": {
#     "term": {
#       "year": 1942
#     }
#   },
#   "knn": {
#     "field": "text_embedding.predicted_value",
#     "query_vector_builder": {
#       "text_embedding": {
#         "model_id": "sentence-transformers__msmarco-minilm-l12-cos-v5",
#         "model_text": "food poisoning"
#       }
#     },
#     "k": 10,
#     "num_candidates": 10
#   },
#   "fields": [
#     "id",
#     "text",
#     "num_of_pages",
#     "year",
#     "doc_type"
#   ],
#   "_source": false
# }


@app.route("/new-openhistorical", methods=["POST"])
def search_openhistorial_knn():
    logging.info("Received an OpenHistorical search request.")
    data = request.get_json()
    logging.info(f"OpenHistorical request data: {data}")

    keyword = data.get("keyword", "")
    year = data.get("year", "")

    if not keyword:
        return jsonify({"error": "Keyword is required"}), 400

    # Construct the query parameters
    query_params = {}
    if year:
        query_params.update(
            {
                "query": {"term": {"year": year}},
            }
        )
    if keyword:
        query_params.update(
            {
                "knn": {
                    "field": "text_embedding.predicted_value",
                    "query_vector_builder": {
                        "text_embedding": {
                            "model_id": "sentence-transformers__msmarco-minilm-l12-cos-v5",
                            "model_text": keyword,
                        }
                    },
                    "k": 10,
                    "num_candidates": 10,
                },
                "fields": ["id", "text", "num_of_pages", "year", "doc_type"],
                "_source": False,
            }
        )

    url = "http://172.17.0.1:9200/document-with-vector/_search"

    try:
        logging.info(f"Sending request to FDA OpenHistorical API: {url}")
        response = requests.get(
            url, json=query_params, headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()

        response_data = response.json()

        # Ensure we correctly handle the API response structure
        hits = response_data.get("hits", {}).get("hits", [])
        results = [
            {
                "num_of_pages": document.get("fields").get("num_of_pages", "N/A")[0],
                "year": document.get("fields").get("year", "N/A")[0],
                "text": document.get("fields").get("text", "N/A")[0],
                "doc_type": document.get("fields").get("doc_type", "N/A")[0],
            }
            for document in hits
        ]

        return jsonify(results)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from FDA OpenHistorical API: {e}")
        return (
            jsonify({"error": "Failed to fetch data from the API", "details": str(e)}),
            500,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
