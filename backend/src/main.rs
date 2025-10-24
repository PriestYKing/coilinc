// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Debug, Deserialize)]
struct HttpRequest {
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    timeout: u64,
}

#[derive(Debug, Serialize)]
struct HttpResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
    duration_ms: u128,
    size_bytes: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct Collection {
    id: String,
    name: String,
    requests: Vec<serde_json::Value>,
    created_at: String,
    updated_at: String,
}

#[tauri::command]
async fn send_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let start = Instant::now();

    // Create HTTP client
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(request.timeout))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    // Build request
    let method = reqwest::Method::from_bytes(request.method.as_bytes())
        .map_err(|e| format!("Invalid HTTP method: {}", e))?;

    let mut req_builder = client.request(method, &request.url);

    // Add headers
    for (key, value) in request.headers {
        req_builder = req_builder.header(key, value);
    }

    // Add body if present
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

    // Send request
    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();

    // Extract headers
    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            headers.insert(key.to_string(), v.to_string());
        }
    }

    // Get response body
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let size_bytes = body.len();
    let duration_ms = start.elapsed().as_millis();

    Ok(HttpResponse {
        status,
        headers,
        body,
        duration_ms,
        size_bytes,
    })
}

#[tauri::command]
async fn save_collection(collection: Collection, path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&collection)
        .map_err(|e| format!("Failed to serialize collection: {}", e))?;

    std::fs::write(&path, json).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn load_collection(path: String) -> Result<Collection, String> {
    let contents =
        std::fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;

    let collection: Collection = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse collection: {}", e))?;

    Ok(collection)
}

#[tauri::command]
async fn generate_code_snippet(
    request: serde_json::Value,
    language: String,
) -> Result<String, String> {
    let method = request["method"].as_str().unwrap_or("GET");
    let url = request["url"].as_str().unwrap_or("");
    let headers = request["headers"].as_object();
    let body = request["body"].as_str();

    let code = match language.as_str() {
        "curl" => generate_curl(method, url, headers, body),
        "javascript" => generate_javascript(method, url, headers, body),
        "python" => generate_python(method, url, headers, body),
        "go" => generate_go(method, url, headers, body),
        "rust" => generate_rust(method, url, headers, body),
        _ => return Err("Unsupported language".to_string()),
    };

    Ok(code)
}

fn generate_curl(
    method: &str,
    url: &str,
    headers: Option<&serde_json::Map<String, serde_json::Value>>,
    body: Option<&str>,
) -> String {
    let mut cmd = format!("curl -X {} '{}'", method, url);

    if let Some(hdrs) = headers {
        for (key, value) in hdrs {
            if let Some(v) = value.as_str() {
                cmd.push_str(&format!(" \\\n  -H '{}: {}'", key, v));
            }
        }
    }

    if let Some(b) = body {
        cmd.push_str(&format!(" \\\n  -d '{}'", b));
    }

    cmd
}

fn generate_javascript(
    method: &str,
    url: &str,
    headers: Option<&serde_json::Map<String, serde_json::Value>>,
    body: Option<&str>,
) -> String {
    let mut code = format!("const response = await fetch('{}', {{\n", url);
    code.push_str(&format!("  method: '{}',\n", method));

    if let Some(hdrs) = headers {
        code.push_str("  headers: {\n");
        for (key, value) in hdrs {
            if let Some(v) = value.as_str() {
                code.push_str(&format!("    '{}': '{}',\n", key, v));
            }
        }
        code.push_str("  },\n");
    }

    if let Some(b) = body {
        code.push_str(&format!("  body: '{}',\n", b.replace("'", "\\'")));
    }

    code.push_str("});\n\nconst data = await response.json();");
    code
}

fn generate_python(
    method: &str,
    url: &str,
    headers: Option<&serde_json::Map<String, serde_json::Value>>,
    body: Option<&str>,
) -> String {
    let mut code = String::from("import requests\n\n");

    code.push_str(&format!("url = '{}'\n", url));

    if let Some(hdrs) = headers {
        code.push_str("headers = {\n");
        for (key, value) in hdrs {
            if let Some(v) = value.as_str() {
                code.push_str(&format!("    '{}': '{}',\n", key, v));
            }
        }
        code.push_str("}\n");
    }

    if let Some(b) = body {
        code.push_str(&format!("data = '{}'\n", b.replace("'", "\\'")));
    }

    code.push_str(&format!(
        "\nresponse = requests.{}(url",
        method.to_lowercase()
    ));

    if headers.is_some() {
        code.push_str(", headers=headers");
    }

    if body.is_some() {
        code.push_str(", data=data");
    }

    code.push_str(")\nprint(response.json())");
    code
}

fn generate_go(
    method: &str,
    url: &str,
    headers: Option<&serde_json::Map<String, serde_json::Value>>,
    body: Option<&str>,
) -> String {
    let mut code = String::from("package main\n\nimport (\n\t\"bytes\"\n\t\"fmt\"\n\t\"io\"\n\t\"net/http\"\n)\n\nfunc main() {\n");

    if let Some(b) = body {
        code.push_str(&format!("\tpayload := []byte(`{}`)\n", b));
        code.push_str(&format!(
            "\treq, _ := http.NewRequest(\"{}\", \"{}\", bytes.NewBuffer(payload))\n",
            method, url
        ));
    } else {
        code.push_str(&format!(
            "\treq, _ := http.NewRequest(\"{}\", \"{}\", nil)\n",
            method, url
        ));
    }

    if let Some(hdrs) = headers {
        for (key, value) in hdrs {
            if let Some(v) = value.as_str() {
                code.push_str(&format!("\treq.Header.Add(\"{}\", \"{}\")\n", key, v));
            }
        }
    }

    code.push_str("\n\tclient := &http.Client{}\n");
    code.push_str("\tres, err := client.Do(req)\n");
    code.push_str("\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n");
    code.push_str("\tdefer res.Body.Close()\n\n");
    code.push_str("\tbody, _ := io.ReadAll(res.Body)\n");
    code.push_str("\tfmt.Println(string(body))\n}");

    code
}

fn generate_rust(
    method: &str,
    url: &str,
    headers: Option<&serde_json::Map<String, serde_json::Value>>,
    body: Option<&str>,
) -> String {
    let mut code = String::from("use reqwest;\n\n#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n");

    code.push_str("    let client = reqwest::Client::new();\n");
    code.push_str(&format!(
        "    let mut request = client.{}(\"{}\")",
        method.to_lowercase(),
        url
    ));

    if let Some(hdrs) = headers {
        for (key, value) in hdrs {
            if let Some(v) = value.as_str() {
                code.push_str(&format!("\n        .header(\"{}\", \"{}\")", key, v));
            }
        }
    }

    if let Some(b) = body {
        code.push_str(&format!("\n        .body(\"{}\")", b.replace("\"", "\\\"")));
    }

    code.push_str(";\n\n    let response = request.send().await?;\n");
    code.push_str("    let body = response.text().await?;\n");
    code.push_str("    println!(\"{}\", body);\n\n    Ok(())\n}");

    code
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            send_request,
            save_collection,
            load_collection,
            generate_code_snippet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
