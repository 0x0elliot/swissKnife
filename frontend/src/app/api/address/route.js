const MAX_ITERATIONS = 3;

const getTransactions = async (address) => {
  try {
    const response = await fetch(`https://eth.blockscout.com/api/v2/addresses/${address}/transactions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`); // Re-throw error for consistent handling
    }
    const data = await response.json();
    return data.items; // Access the "items" array
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return []; // Return empty array on error
  }
};

const buildGraphData = async (initialAddress) => {
  const nodes = [];
  const links = [];
  const visitedAddresses = new Set();
  const queue = [initialAddress];

  while (queue.length > 0 && visitedAddresses.size < MAX_ITERATIONS) {
    const currentAddress = queue.shift();
    if (visitedAddresses.has(currentAddress)) continue;

    visitedAddresses.add(currentAddress);
    nodes.push({ id: currentAddress });


    try {  // Wrap the API call in a try-catch

      const transactions = await getTransactions(currentAddress);

      transactions.forEach((transaction) => {
        const fromAddress = transaction.from?.hash;  // Use optional chaining and .hash
        if (fromAddress && !visitedAddresses.has(fromAddress) && fromAddress !== currentAddress) {
          queue.push(fromAddress);
          nodes.push({ id: fromAddress });
          links.push({ source: currentAddress, target: fromAddress, value: transaction.value });
        }

        const toAddress = transaction.to?.hash;  // Use optional chaining and .hash

        if (toAddress && !visitedAddresses.has(toAddress) && toAddress !== currentAddress ) {
          queue.push(toAddress);
          nodes.push({ id: toAddress });
          links.push({ source: currentAddress, target: toAddress, value: transaction.value });
        }

      });


    } catch (error) {
      console.error(`Error processing transactions for ${currentAddress}:`, error)
      // Potentially add error handling logic here, like skipping this address or notifying the user.
    }
  }

  return { nodes, links };
};


export async function GET(req) {  // Use GET request handler
  try {
    const { searchParams } = new URL(req.url);
    const initialAddress = searchParams.get("address");

    if (!initialAddress) {
      return new Response(
        JSON.stringify({ error: "Missing 'address' parameter" }),
        { status: 400 } // Bad Request
      );
    }

    const graphData = await buildGraphData(initialAddress);
    return new Response(JSON.stringify(graphData), {
      status: 200,
      headers: { "Content-Type": "application/json" }, // Set content type
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch graph data" }),
      { status: 500 } // Internal Server Error
    );
  }
}