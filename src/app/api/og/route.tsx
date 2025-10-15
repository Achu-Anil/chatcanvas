import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Allow customization via query params
    const title = searchParams.get("title") || "ChatCanvas";
    const description =
      searchParams.get("description") || "Build AI Chat Apps in Minutes";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            backgroundImage:
              "radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        >
          {/* Main Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              textAlign: "center",
            }}
          >
            {/* Logo/Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    fill="white"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "24px",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                display: "flex",
                fontSize: "32px",
                color: "#a1a1aa",
                marginBottom: "40px",
                maxWidth: "800px",
              }}
            >
              {description}
            </div>

            {/* Tech Stack Badges */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              {["Next.js", "TypeScript", "Tailwind CSS", "OpenAI"].map(
                (tech) => (
                  <div
                    key={tech}
                    style={{
                      display: "flex",
                      padding: "12px 24px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "9999px",
                      fontSize: "20px",
                      color: "#a1a1aa",
                    }}
                  >
                    {tech}
                  </div>
                )
              )}
            </div>

            {/* Bottom gradient accent */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error("Error generating OG image:", e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
