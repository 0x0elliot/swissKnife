from flask import Flask, request, jsonify
from simpleeval import simple_eval

app = Flask(__name__)

@app.route('/evaluate', methods=['POST'])
def evaluate_rule():
    print('Request received: ', request.json)
    try:
        # Get the JSON data from the request
        data = request.json

        # Extract rule and data from the request
        rule = data.get('rule', '')
        input_data = data.get('data', {})

        if not rule:
            return jsonify({'error': 'Rule is required'}), 400

        # Evaluate the rule using simpleeval
        result = simple_eval(rule, names={ 'data': input_data }) # data["event"]["signature"] == "LogEvent(address,address,string)"
        if result not in [True, False]:
            return jsonify({'error': 'Invalid rule'}), 400

        return jsonify({'result': result})

    except Exception as e:
        print('Error: ', str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

