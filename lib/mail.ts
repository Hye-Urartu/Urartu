export function getMessage(
  title: string,
  userName: string,
  contents: string[],
  action: { url: string; text: string },
  notes: string[]
) {
  return `
      <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    
      <style type="text/css">
      body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
  
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; color: #ffffff; font-family: 'Geist', Arial, sans-serif; line-height: 1.5;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #09090b;">
          <tr>
              <td style="padding: 40px 30px;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 20px;">${title}</h1>
                  <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
                  ${contents
                    .map(
                      (content) =>
                        `<p style="color: #e0e0e0; font-size: 16px; margin-bottom: 30px;">${content}</p>`
                    )
                    .join("")}
                  ${
                    action
                      ? `<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                          <td align="center" style="border-radius: 8px;">
                          <a href="${action.url}" target="_blank">
                              <button style="display: inline-block; padding: .5rem 1rem; font-size: 14px; color: #09090b; background-color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">${action.text}</button>
                          </a>
                          </td>
                      </tr>
                        </table>`
                      : ""
                  }
                
                  ${notes
                    .map(
                      (note) =>
                        `<p style="color: #a0a0a0; font-size: 14px; margin-bottom: 20px;">${note}</p>`
                    )
                    .join("")}
                   <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 20px;">If you're having trouble with the button, copy and paste the URL below into your web browser:</p>
                  ${
                    action
                      ? `<p style="color: #0070f3; font-size: 14px; margin-bottom: 30px; word-break: break-all;">${action.url}</p>`
                      : ""
                  }
                  <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 10px;">Best regards,<br>${
                    process.env.NEXT_PUBLIC_COMPANY_NAME
                  } | Hye Urartu</p>
              </td>
          </tr>
      </table>
  </body>
  </html>
  
      `;
}
