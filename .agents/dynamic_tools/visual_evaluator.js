// Self-Synthesized Tool: visual_evaluator
// MCP tool that receives a local image or canvas snapshot path, sends it to the NVIDIA Nemotron Nano 12B VL model (via an external inference endpoint), and returns a JSON analysis containing UI layout quality scores, 3D scene composition assessment, and overlaid coordinate markings (Set‑of‑Mark) as base64‑encoded PNG.
module.exports = module.exports = async (args, context) => {
  const {
    image_path,
    model_endpoint = "https://api.nvidia.com/v1/vision/nemotron-nano-12b-v2-vl",
  } = args;
  const fs = require("fs");
  const fetch = require("node-fetch");

  if (!image_path) {
    return { error: "image_path is required" };
  }

  // Read image file
  let imageData;
  try {
    imageData = fs.readFileSync(image_path);
  } catch (e) {
    return { error: "Failed to read image file", details: e.message };
  }

  // Prepare multipart/form-data request
  const FormData = require("form-data");
  const form = new FormData();
  form.append("file", imageData, {
    filename: require("path").basename(image_path),
    contentType: "image/png",
  });

  // Call the vision model endpoint (assumes it accepts multipart/form-data and returns JSON)
  let response;
  try {
    response = await fetch(model_endpoint, {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    });
  } catch (e) {
    return {
      error: "Failed to call vision model endpoint",
      details: e.message,
    };
  }

  if (!response.ok) {
    const txt = await response.text();
    return {
      error: "Vision model request failed",
      status: response.status,
      body: txt,
    };
  }

  const result = await response.json();

  // Expected result format from the model (customizable). For safety, we ensure required fields exist.
  const analysis = result.analysis || "No analysis provided";
  const layoutScore = result.layoutScore || null;
  const sceneScore = result.sceneScore || null;
  const markings = result.markingsBase64 || null; // base64 PNG with overlaid coordinates

  return {
    success: true,
    analysis,
    layoutScore,
    sceneScore,
    markingsBase64: markings,
  };
};
