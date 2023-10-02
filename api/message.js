export default function handler(request, response) {
  const { wasSuccessful } = request.body;
  if (wasSuccessful) {
    return response.json({ success: "API call was successful" });
  } else {
    return response.json({ error: "There was an error" });
  }
}
