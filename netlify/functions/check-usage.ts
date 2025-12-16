import { Handler } from "@netlify/functions";
import { canSubmitReview, incrementUsage } from "../../lib/usage-tracking";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { organizationId, action } = JSON.parse(event.body || "{}");

    if (!organizationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Organization ID is required" }),
      };
    }

    if (action === "check") {
      // Check if organization can submit a review
      const result = await canSubmitReview(organizationId);

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } else if (action === "increment") {
      // Increment usage count
      const success = await incrementUsage(organizationId);

      return {
        statusCode: 200,
        body: JSON.stringify({ success }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid action. Must be 'check' or 'increment'" }),
      };
    }
  } catch (error: any) {
    console.error("Usage check error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

