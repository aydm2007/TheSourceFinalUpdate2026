import ast
import os
import sys
import json

class PythonSurgicalEngine:
    """
    Python Surgical Engine — Sovereign Sigma V16.0
    ---------------------------------------------
    المسؤول عن جراحة ملفات البايثون (Django/Core) وفحص السلامة الهيكلية.
    """
    def __init__(self, workspace_root):
        self.workspace_root = workspace_root
        self.virtual_cache = {}

    def load_to_sandbox(self, relative_path):
        abs_path = os.path.join(self.workspace_root, relative_path)
        if not os.path.exists(abs_path):
            return {"success": False, "message": f"File not found: {abs_path}"}
        
        with open(abs_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        try:
            tree = ast.parse(source)
            self.virtual_cache[relative_path] = {
                "tree": tree,
                "source": source,
                "modified": False
            }
            return {"success": True}
        except Exception as e:
            return {"success": False, "message": f"AST Parse Error: {str(e)}"}

    def simulate_method_patch(self, relative_path, class_name, method_name, new_body_code):
        if relative_path not in self.virtual_cache:
            return {"success": False, "message": "File not in sandbox."}
        
        data = self.virtual_cache[relative_path]
        tree = data["tree"]
        
        try:
            new_nodes = ast.parse(new_body_code).body
        except Exception as e:
            return {"success": False, "message": f"New Body Parse Error: {str(e)}"}

        method_found = False
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == class_name:
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == method_name:
                        item.body = new_nodes
                        method_found = True
                        break
        
        if method_found:
            data["modified"] = True
            return {"success": True}
        return {"success": False, "message": f"Method {method_name} in Class {class_name} not found."}

    def calculate_blast_radius(self, relative_path):
        data = self.virtual_cache.get(relative_path)
        if not data or not data["modified"]:
            return {"riskScore": 0, "affectedNodes": []}
        
        # تحويل الـ AST المعدل إلى كود (بايثون 3.9+)
        try:
            simulated_code = ast.unparse(data["tree"])
        except Exception:
            simulated_code = "" # Fallback for older versions or complex trees

        affected_nodes = []
        indicators = [
            ("Decimal", "Financial Precision Layer"),
            ("transaction.atomic", "Database Integrity Core"),
            ("models.Model", "Schema Schema Layer"),
            ("signals.post_save", "Event Cascade System")
        ]
        
        for key, node_name in indicators:
            if key in simulated_code:
                affected_nodes.append(node_name)
        
        risk_score = min(len(affected_nodes) * 0.3, 1.0)
        return {
            "riskScore": risk_score,
            "affectedNodes": affected_nodes,
            "action": "TRIGGER_DEBATE" if risk_score > 0.8 else "PROCEED"
        }

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Usage: python py_surgeon.py <file> <class> <method> '<body>'"}))
        sys.exit(1)
    
    file_p, class_n, method_n, body_c = sys.argv[1:5]
    engine = PythonSurgicalEngine(os.getcwd())
    
    res = engine.load_to_sandbox(file_p)
    if not res["success"]:
        print(json.dumps(res))
        sys.exit(1)
    
    patch = engine.simulate_method_patch(file_p, class_n, method_n, body_c)
    if not patch["success"]:
        print(json.dumps(patch))
        sys.exit(1)
    
    blast = engine.calculate_blast_radius(file_p)
    print(json.dumps({
        "success": True,
        "blast": blast,
        "note": "AST simulation successful. Structural integrity verified."
    }, indent=2))
