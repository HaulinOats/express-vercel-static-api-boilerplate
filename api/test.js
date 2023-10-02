export default function handler(request, response) {
  const { name } = request.body;
  return response.json({ name });
}
