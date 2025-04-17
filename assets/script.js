class GitHubActionTrigger extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 400px;
          margin: 0 auto;
          text-align: center;
        }
        button {
          appearance: none;
          box-shadow: none;
          border: none;
          border-radius: 6px;
          background: var(--action);
          padding: 0.5em 1em;
          font-size: 1em;
          cursor: pointer;
          margin-top: 2rem;
          color: #fff;
          white-space: nowrap;
          line-height: 0;
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        button span {
          display: inline-block;
          padding: 0.5rem 0;
        }
        .spinner {
          display: none;
          width: 1em;
          height: 1em;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        button.loading .spinner {
          display: inline-block;
        }
        button.loading span {
          display: none;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .text_btn {
          display: none;
          padding: 0;
          margin: 0 auto;
          background: transparent;
          color: var(--action);
          line-height: 1.2;
        }
        .text_btn.show {
          display: block;
          margin-top: 1rem;
        }
        dialog {
          border: none;
          border-radius: 5px;
          padding: 1em;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        dialog:-internal-dialog-in-top-layer::backdrop {
          background-color: #f8ed8cdd;
        }
        form {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        h2 {
          font-size: 1.2rem;
        }
        input {
          padding: 0.5em;
          margin: 0.5em 0;
          font-size: 1em;
        }
        menu {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
          padding: 0;
        }
        menu button {
          margin-top: 1rem;
        }
      </style>
      <button id="triggerBtn">
        <div class="spinner"></div>
        <span>Save your date now</span>
      </button>
      <button class="text_btn" id="forgetBtn">
        Forget Token
      </button>
      <dialog id="tokenDialog">
        <form method="dialog">
          <h2>Please enter your GitHub token</h2>
          <p>
            For more information, visit the
            <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" target="_blank">GitHub documentation</a>.
          </p>
          <input type="text" id="tokenInput" placeholder="GitHub Token" required>
          <menu>
            <button type="submit" id="saveBtn"><span>Save Token</span></button>
            <button type="button" id="cancelBtn"><span>Cancel</span></button>
          </menu>
        </form>
      </dialog>
    `;
	}

	connectedCallback() {
		const triggerBtn = this.shadowRoot.getElementById("triggerBtn");
		const forgetBtn = this.shadowRoot.getElementById("forgetBtn");
		const tokenDialog = this.shadowRoot.getElementById("tokenDialog");
		const tokenForm = tokenDialog.querySelector("form");
		const cancelBtn = this.shadowRoot.getElementById("cancelBtn");

		const token = localStorage.getItem("githubToken");
		if (!token) {
			forgetBtn.classList.remove("show");
		} else {
			forgetBtn.classList.add("show");
		}

		forgetBtn.addEventListener("click", () => {
			localStorage.removeItem("githubToken");
			forgetBtn.classList.remove("show");
		});

		triggerBtn.addEventListener("click", () => {
			const token = localStorage.getItem("githubToken");
			if (!token) {
				this.showDialog();
			} else {
				this.triggerAction(token);
			}
		});

		tokenForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const tokenValue = this.shadowRoot
				.getElementById("tokenInput")
				.value.trim();
			if (tokenValue) {
				localStorage.setItem("githubToken", tokenValue);
				forgetBtn.classList.add("show");
				tokenDialog.close();
				this.triggerAction(tokenValue);
			} else {
				alert("Please enter a valid token.");
			}
		});

		cancelBtn.addEventListener("click", () => tokenDialog.close());
	}

	showDialog() {
		const tokenDialog = this.shadowRoot.getElementById("tokenDialog");
		if (typeof tokenDialog.showModal === "function") {
			tokenDialog.showModal();
			tokenDialog.addEventListener("click", (event) => {
				if (event.target === tokenDialog) {
					tokenDialog.close();
				}
			});
		} else {
			tokenDialog.setAttribute("open", "");
		}
	}

	setLoading(isLoading) {
		const triggerBtn = this.shadowRoot.getElementById("triggerBtn");
		if (isLoading) {
			triggerBtn.classList.add("loading");
			triggerBtn.disabled = true;
		} else {
			triggerBtn.classList.remove("loading");
			triggerBtn.disabled = false;
		}
	}

	triggerAction(token) {
		const ORG = "dominikwilkowski";
		const repo = "leave_calendar";

		const url = `https://api.github.com/repos/${ORG}/${repo}/dispatches`;
		const payload = {
			event_type: "append-date",
			client_payload: {
				line: ["Dom 2025-04-11,2025-04-12"],
			},
		};

		this.setLoading(true);

		fetch(url, {
			method: "POST",
			headers: {
				Authorization: "token " + token,
				Accept: "application/vnd.github.v3+json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		})
			.then((response) => {
				this.setLoading(false);
				if (response.ok) {
					alert("GitHub Action triggered successfully!");
				} else {
					response.json().then((data) => {
						alert("Error: " + (data.message || "Unknown error"));
					});
				}
			})
			.catch((error) => {
				this.setLoading(false);
				alert("Network error: " + error);
			});
	}
}

customElements.define("github-action-trigger", GitHubActionTrigger);
