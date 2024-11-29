// Dummy database to store placed orders (simulated)
const orders = [];

// API handler
export default function handler(req, res) {
  if (req.method === "POST") {
    const { products, customerName, customerEmail } = req.body;

    // Validate request body
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products array is required and cannot be empty." });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Customer name and email are required." });
    }

    // Simulate order ID generation
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate total price
    const totalPrice = products.reduce((sum, product) => sum + (product.price || 0), 0);

    // Simulate saving the order
    const order = {
      orderId,
      customerName,
      customerEmail,
      products,
      totalPrice,
      createdAt: new Date().toISOString(),
    };

    orders.push(order);

    // Respond with a success message
    return res.status(201).json({
      message: "Order placed successfully!",
      order,
    });
  } else {
    // Handle non-POST requests
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }
}
