'use strict';

window.clientLoaded = false;
window.__clientDebug = false;

let statusEl = document.getElementById("loadingStatus");

// Every write goes through here, and statusEl is deliberately replaced with a
// bare object by throwInitError() to silence later updates. Guard the writes so
// that sentinel — and a missing loader element, which is the documented
// standalone-injection case handled at the bottom of this file — can't turn a
// status message into a TypeError that masks the real failure.
const logInitStatus = (message, html = false) => {
	console.log(message);
	if (!statusEl || !(statusEl instanceof Element)) return;
	if (html) {
		statusEl.innerHTML = message
	} else {
		statusEl.textContent = message
	}
};

logInitStatus("Loaded init script, waiting for userscript...");

const throwInitError = (msg, html = false) => {
	document.body.querySelector("#loading .icon-refresh")?.remove();
	// Callers pass either a string or a caught Error; normalise so the status
	// line never renders "[object Object]" and new Error() gets a real message.
	const text = msg instanceof Error ? msg.message : String(msg);
	logInitStatus(text, html);
	statusEl = {};
	throw new Error(text);
};

const addScript = (url) => {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = url;
		script.async = false;

		script.onload = () => {
			resolve(script);
		};
		
		script.onerror = () => {
			throwInitError("Error loading script " + url);
			reject(new Error("Error loading script " + url));
		};

		document.body.appendChild(script);
	});
};

const initScriptPromises = [
	addScript("https://www.redditstatic.com/modmail/runtime~Modmail.741ddec20aaf5c2ab9f5.js"),
	addScript("https://www.redditstatic.com/modmail/vendors~Modmail.1757105564638be6db65.js")
];

const main = (event) => {
	if (!window.__MODREDDITCOM_REVIVED__ || __MODREDDITCOM_REVIVED__.version < 1) {
		throwInitError(
			`Please <a
				href="https://greasyfork.org/en/scripts/570323-mod-reddit-com-revived"
				target="_blank"
			>update your userscript</a> to v1.3 or above!`, true
		);
	} else {
		logInitStatus("Loading API data...");
	}

	const path = (!window.location.pathname.startsWith("/mail/") || location.pathname === "/mail/") ? "/mail/all" : location.pathname;
	const segments = path.split('/').filter(Boolean);
	const isSearchPage = segments[1] === "search" || segments[1] === "recruiting";
	const validStates = new Set(["all", "inbox", "new", "inprogress", "archived", "filtered", "appeals", "join_requests", "highlighted", "mod", "notifications", "search", "recruiting"]);
	const isValidState = validStates.has(segments[1]);

	const currentPage = {
		url: path,
		urlParams: {
			page: isValidState ? segments[1] : "all",
			threadId: segments[2] || null,
			messageId: segments[3] || null
		},
		queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
		hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))),
		status: 200,
		referrer: document.referrer || "",
	};

	const homePage = {
		url: "/mail/all",
		urlParams: { page: "all", threadId: null, messageId: null },
		queryParams: {},
		hashParams: {},
		status: 200,
		referrer: document.referrer || "",
	};

	if (currentPage.urlParams.page === "recruiting")
		currentPage.queryParams.q = 'subject:"mod application"';
	const searchQuery = currentPage.queryParams.q ?? '';
	const conversationsUrl = `/api/mod/conversations/${isSearchPage ? "search" : (currentPage.urlParams.threadId ?? '')}?${
		new URLSearchParams({
			...(isSearchPage ? {} : { state: currentPage.urlParams.page }),
			...currentPage.queryParams,
			// redditWebClient: "modmail",
		})
	}`;
	// Optional chaining: these loader-screen nodes only exist when the userscript
	// built the page. Injecting clientRecover standalone is an anticipated case
	// (see the rAPI-accessToken-ready fallback at the bottom of this file), and a
	// hard TypeError here would kill init before that path could report anything.
	const modMailUrlEl = document.getElementById("modMailUrl");
	if (modMailUrlEl) modMailUrlEl.textContent = conversationsUrl;

	window.___r = {
		account: {
			api: { isPending: false, error: null },
			data: { __type: "Account", isReduceAnimationsEnabled: false },
		},
		apiRequestHeaders: {
			"X-sa-user-agent": navigator.userAgent,
			"user-agent": "reddit-modmail/0.0.2",
			"X-Forwarded-For": "127.0.0.1",
		},
		communities: {
			admin: { idList: [], selected: null },
			api: { isPending: false, error: null },
			data: {},
			fetched: {},
			selected: { idList: [], allSelected: true, anySelected: true },
			sort: "subscribers",
		},
		experiments: {
			api: { error: null, isPending: false },
			models: {
				modmail_recruiting_folder: { id: 20539, name: "modmail_recruiting_folder", variant: "enabled", version: "2" }
			}
		},
		filter: { searchFilterText: "" },
		mail: {
			selected: { allSelected: false, idList: [], selectedIds: {} },
			sort: "recent",
			sortNewListing: "unread",
			all: { count: null, isPending: false, error: null },
			new: { count: null, isPending: false, error: null },
			inprogress: { count: null, isPending: false, error: null },
			archived: { count: null, isPending: false, error: null },
			appeals: { count: null, isPending: false, error: null },
			join_requests: { count: null, isPending: false, error: null },
			highlighted: { count: null, isPending: false, error: null },
			mod: { count: null, isPending: false, error: null },
			notifications: { count: null, isPending: false, error: null },
			inbox: { count: null, isPending: false, error: null },
			filtered: { count: null, isPending: false, error: null },
			recruiting: { count: null, isPending: false, error: null },
		},
		meta: {
			platform: {
				name: "",
				deviceName: "",
				osName: "linux",
				osVersion: "x86_64",
				browserName: "firefox",
				browserVersion: "144-0",
				primaryLanguage: "en-US",
				languageList: "en-US,en;q=0.5",
				isWebview: false,
			},
			userAgent: navigator.userAgent,
		},
		messages: {
			api: { threadId: null, isPending: false, error: null },
			data: {}
		},
		modActions: {},
		modNotes: { api: {}, data: {} },
		reportRules: { api: { isPending: false, error: null }, data: {} },
		savedResponses: { data: [], loading: false, error: null },
		search: {
			api: { query: searchQuery, isPending: false, error: null },
			canLoadMore: { [searchQuery]: true },
			query: searchQuery,
			results: { [searchQuery]: [] },
			sort: "relevance",
		},
		session: {
			__type: "Session",
			get accessToken() {
				return window.tokenCache.token
			},
			tokenType: "RSSG",
			get expires() {
				return window.tokenCache.expires
			},
		},
		sidebar: { showSidebar: false },
		theme: window.__MODREDDITCOM_REVIVED__?.theme ?? "light",
		threads: {
			api: {
				newThreadPending: false,
				newThreadError: null,
				pending: {},
				errors: {},
				archivePending: {},
				filterPending: {},
				approveUserPending: {},
			},
			data: {}
		},
		threadUsers: {},
		toaster: { isOpen: false, type: null, message: null, submessage: null },
		widgets: { tooltip: { target: null, id: null }, modal: { id: null }, savedScrollPositions: {} },
		visibility: {},
		platform: {
			...(isValidState && !isSearchPage
				? { currentPageIndex: 0, history: [ currentPage ] }
				: { currentPageIndex: 1, history: [ homePage, currentPage ] }
			),
			currentPage,
			shell: false,
		},
	};


	/* Error and toast */
	const apiStatusElements = {
		conv: document.getElementById("apiStatus-conv"),
		me: document.getElementById("apiStatus-me"),
		subs: document.getElementById("apiStatus-subs"),
		count: document.getElementById("apiStatus-count")
	};
	const setAPILoaded = (id, success = true) => {
		const el = apiStatusElements[id];
		if (el) el.className = success ? "icon icon-checkmark" : "icon icon-error";
	};

	window.clearNativeToast = () => window.store?.dispatch({ type: "TOASTER__HIDE_TOASTER" });
	window.nativeError = ({ message, submessage = "", throwError = true, timeout = 4000 }) => {
		clearNativeToast();
		window.store?.dispatch({
			type: 'TOASTER__SHOW_TOASTER',
			payload: { type: 'error', message, submessage }
		});
		if (timeout) setTimeout(clearNativeToast, timeout);

		if (throwError) {
			throw new Error(message + ": " + submessage);
		} else {
			console.error(message + ": " + submessage);
		}
	};
	window.nativeToast = ({ message, submessage = "", timeout = 4000, type = '' }) => {
		console.log(message + ": " + submessage);
		clearNativeToast();
		window.store?.dispatch({
			type: 'TOASTER__SHOW_TOASTER',
			payload: { type, message, submessage }
		});
		if (timeout) setTimeout(clearNativeToast, timeout);
	};


	/* Data fetching functions */
	window.APICache = new Map();
	const getCache = (key, maxAge = 5 * 60_000) => {
		const entry = APICache.get(key);
		if (!entry) return null;
		if (maxAge === -1 || (Date.now() - entry.ts) < maxAge) {
			console.debug("Returned cache: "+key);
			return entry.data;
		} else {
			APICache.delete(key);
			return null;
		}
	};
	const setCache = (key, data) => APICache.set(key, { data, ts: Date.now() });

	/* const getCache = (key, maxAge = 5 * 60_000) => {
		const entry = JSON.parse(sessionStorage.getItem(key));
		if (!entry) return null;
		if ((Date.now() - entry.ts) < maxAge) {
			return entry.data;
		} else {
			sessionStorage.removeItem(key);
			return null;
		}
	};
	const setCache = (key, data) => {
		const value = JSON.stringify({ data, ts: Date.now() });
		try {
			sessionStorage.setItem(key, value);
		} catch(e) {
			sessionStorage.clear();
			sessionStorage.setItem(key, value);
		}
	}; */

	window.getJSON = async function (url, { cache, maxCacheAge = 5 * 60_000 } = { cache: false }) {
		if (cache) {
			const data = getCache(url, maxCacheAge);
			if (data) return data;
		};

		const resp = await fetch("https://oauth.reddit.com" + url, {
			method: "GET",
			headers: {
				"Authorization": "Bearer " + await getToken(),
				"Content-Type": "application/json",
			},
		});

		// Read the body exactly once. The previous version parsed it inside the
		// !resp.ok branch and then fell through to a second resp.json(), which
		// throws "body stream already read" — replacing the useful API message
		// with a stream error on every single failure.
		const isJSON = (resp.headers.get("content-type") || "").startsWith("application/json");
		const data = isJSON ? await resp.json().catch(() => null) : null;

		if (!resp.ok) {
			if (data) {
				// Reddit has shipped both spellings of this field over the years.
				const explanation = data.explanation ?? data.explaination;
				if (clientLoaded) {
					nativeError({
						message: `API error: ${data.message}${data.reason ? ` (${data.reason})` : ""}`,
						submessage: explanation ? `"${explanation}" on field "${data.fields}"` : "URL: "+url
					})
				} else {
					logInitStatus([data.message, data.reason && `"${data.reason}"`, explanation, data.fields?.length && `fields: ${data.fields.join(', ')}`].filter(Boolean).join(' | '))
				}
			} else {
				if (clientLoaded) {
					nativeError({ message: "API error: status "+resp.status, submessage: "URL: "+url })
				} else {
					logInitStatus("Error " + resp.status + " while fetching " + url)
				}
			}
			// nativeError() only throws once the client is up; before that it is a
			// no-op, so throw here to make sure callers see the failure either way.
			throw new Error(`API request failed (${resp.status}): ${url}`);
		};

		if (data === null) throw new Error("Non-JSON response from " + url);

		if (cache) setCache(url, data);
		return data;
	};

	window.gqlFetch = async function (
		operationName, sha256Hash, variables,
		{ parseJSON = true, cache = false, maxCacheAge = 5 * 60_000 } = { parseJSON: true, cache: false, maxCacheAge: 5 * 60_000 }
	) {
		const cacheKey = operationName + "~" + JSON.stringify(variables);

		if (cache) {
			const data = getCache(cacheKey, maxCacheAge);
			if (data) {
				if (typeof data === "string") {
					return parseJSON ? (JSON.parse(data)).data : data;
				} else {
					return parseJSON ? data : JSON.stringify({ data });
				}
			}
		};

		const resp = await window.gmFetch({
			method: "POST",
			url: "https://gql-fed.reddit.com?"+operationName,
			headers: {
				"Authorization": "Bearer " + await getToken(),
				"Content-Type": "application/json",
				"Origin": "https://mod.reddit.com",
				"Referer": "https://mod.reddit.com/"
			},
			data: JSON.stringify({
				operationName,
				variables,
				extensions: {
					persistedQuery: {
						version: 1,
						sha256Hash
					},
				},
			}),
			anonymous: true,
		});

		if (resp.status !== 200)
			nativeError({ message: "GraphQL endpoint error", submessage: `Status code ${resp.status} with operationName`, throwError: false });

		if (!parseJSON) {
			if (cache) setCache(cacheKey, resp.responseText);
			return resp.responseText;
		}

		const data = JSON.parse(resp.responseText);
		if (data.errors) {
			const groupErrors = (errors) => {
				// Group paths by their error message
				const groups = errors.reduce((acc, err) => {
					if (!acc[err.message]) acc[err.message] = [];
					if (err.path) acc[err.message].push(err.path[err.path.length - 1]);
					return acc;
				}, {});

				// Format each group into a single string
				return Object.entries(groups).map(([msg, paths]) => {
					const pathSuffix = paths.length > 0 ? ` (Fields: ${paths.join(", ")})` : "";
					return `${msg}${pathSuffix}`;
				});
			};

			const uniqueSummaries = groupErrors(data.errors);

			nativeError({
				message: `(${data.errors.length}) ${operationName}`,
				submessage: uniqueSummaries.join(" | "),
			});
		}

		if (cache) setCache(cacheKey, data.data);
		return data.data;
	}


	/**********************
	* Hydrate window.___r *
	***********************/

	const subredditNameIdMap = {};
	const getSubredditIdFromName = async (subredditName) => {
		if (subredditNameIdMap[subredditName]) {
			return subredditNameIdMap[subredditName]
		}
		const { subredditInfoByName: sr } = await gqlFetch("ResolveSubredditIdByName", "ab369481bd623ada16cfd72dbaab1d53efcd6a198dbf1ededa81d21fc34ed731", { subredditName });
		subredditNameIdMap[subredditName] = sr.id;
		return sr.id;
	}

	const addTypesToObject = (obj, type) => {
		for (const key of Object.keys(obj)) {
			obj[key].__type = type;
		};
		return obj;
	};

	Promise.all([
		getJSON(conversationsUrl)
			.then(({ conversations = null, messages = null, user = null, conversation = null, modActions = null, conversationIds = [] }) => {
				if (!(conversations || messages || user || conversation || modActions)) {
					throwInitError("no data returned by API");
					setAPILoaded('conv', false);
					return;
				}

				if (conversations) ___r.threads.data = addTypesToObject(conversations, "Thread");
				if (messages) ___r.messages.data = addTypesToObject(messages, "Message");
				if (modActions) ___r.modActions = modActions;
				if (isSearchPage) ___r.search.results[searchQuery] = conversationIds;
				if (conversation) {
					if (user) {
						user.__type = "ThreadUser";
						___r.threadUsers[
							currentPage.urlParams.messageId || currentPage.urlParams.threadId
						] = user;
					}
					conversation.__type = "Thread";
					___r.threads.data[conversation.id] = conversation;
					___r.threads.api.pending[conversation.id] = false;
					___r.threads.api.errors[conversation.id] = null;
				}
				setAPILoaded("conv");
			}).catch(e => { setAPILoaded('conv', false); throwInitError(e.message); }),

		getJSON("/api/mod/conversations/subreddits")
			.then(({ subreddits }) => {
				___r.communities.data = addTypesToObject(subreddits, "Subreddit");
				___r.communities.selected.idList = Object.keys(subreddits);

				for (const [id, { name }] of Object.entries(subreddits)) {
					___r.communities.selected[id] = true;
					subredditNameIdMap[name] = id;
				}
				// logStatus("Loaded /api/mod/conversations/subreddits");
				setAPILoaded("subs");
			}).catch(e => { setAPILoaded('subs', false); throwInitError(e.message); }),

		getJSON("/api/v1/me")
			.then(({ id, name, is_mod: isMod, is_employee: isEmployee, over_18, icon_img }) => {
				// Strip query params from icon_img. Reddit serves the avatar as a
				// pre-signed transform URL (?width=…&crop=…&s=<HMAC>); the signature
				// frequently rejects and styles.redditmedia.com returns 403. The
				// un-transformed original at the same path is served unsigned.
				const iconUrl = icon_img ? icon_img.split('?')[0] : icon_img;
				Object.assign(___r.account.data, {
					name, isEmployee, isMod, iconUrl,
					id: "t2_" + id,
					hideNsfw: !over_18
				});
				// logStatus("Loaded /api/v1/me");
				setAPILoaded("me");
			}).catch(e => { setAPILoaded('me', false); throwInitError(e.message); }),

		getJSON("/api/mod/conversations/unread/count")
			.then((counts) => {
				for (const [inboxType, count] of Object.entries(counts)) {
					___r.mail[inboxType].count = count;
				}
				// logStatus("Loaded /api/mod/conversations/unread/count")
				setAPILoaded("count");
			}).catch(e => { setAPILoaded('count', false); throwInitError(e.message); })

	]).then(async () => {
		logInitStatus("Loaded all API data! Initializing React client...");
		await Promise.all(initScriptPromises);
		addScript("https://www.redditstatic.com/modmail/Modmail.fe6613eee4e66a40913d.js").then(() => {
			const container = document.getElementById('container');
			const timer = setInterval(() => {
				const root = container._reactRootContainer;

				if (root?.current?.memoizedState?.element?.props?.store) {
					window.store = root.current.memoizedState.element.props.store;
					console.log("Redux store captured successfully!");
					clearInterval(timer);
					window.clientLoaded = true;
				}
			}, 50);

			setTimeout(() => {
				if (!window.store) console.error("Timed out trying to capture redux store. (>5 seconds)");
				clearInterval(timer);
			}, 5000);
		});
	}).catch(e => {
		// Each of the four fetches above already reports its own failure via
		// throwInitError, which silences statusEl and rethrows — so by the time
		// we land here the user has been told what broke, and calling
		// throwInitError again would only write into the dead sentinel and throw
		// a second time, surfacing as an unhandled rejection that buries the real
		// message. Report a first failure; stay quiet about a duplicate.
		if (statusEl instanceof Element) throwInitError(e);
		else console.error("Modmail init failed:", e);
	});


	/********************
	* Runtime logic fix *
	*********************/

	// Avoid unnecessary page reloads
	const modmailDomains = new Set(['mod.reddit.com', 'www.reddit.com', window.location.host]);
	document.addEventListener('click', (e) => {
		// Leave new-tab / new-window intents to the browser. Without this the
		// interceptor swallows ctrl-click, cmd-click and shift-click on every
		// modmail link, so you can never open two threads at once.
		// (e.button ?? 0) — keyboard activation and synthetic dispatchEvent('click')
		// can arrive without a button property; those are still plain navigations.
		if ((e.button ?? 0) !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

		const anchor = e.target.closest?.('a');
		if (!anchor || !anchor.href) return;

		// An explicit target is also a request for a separate tab. The one
		// internal /mail/ link that sets it is the per-row external-link icon
		// (aria-label "open message in new window"), which this interceptor was
		// otherwise rewriting into an in-place navigation — i.e. that button did
		// not do what it says. Sidebar folder links carry no target and are
		// unaffected.
		if (anchor.target && anchor.target !== '_self') return;

		// Thread-header action links (Archive, Filter Conversation) are rendered
		// by the bundle as <a href="/mail/<folder>"> whose React onClick does
		// preventDefault() -> dispatch action -> window.location = folder.
		// Swallowing the event here would kill the action (the "archive does
		// nothing in thread view" bug). They get their own handler below, which
		// runs the action and then routes with pushState instead of reloading.
		if (anchor.classList.contains('ThreadViewerHeader__control')) return;

		const url = new URL(anchor.href);

		// Check if the link is pointed at a Reddit Modmail domain
		if (modmailDomains.has(url.host)) {
			// If it's a Modmail path, intercept it
			if (url.pathname.startsWith('/mail/')) {
				e.preventDefault();
				// preventDefault() only cancels the BROWSER's default click action.
				// The upstream Modmail React bundle has its own delegated onClick
				// handler that calls window.location.assign() for link components,
				// causing a full HTTP navigation despite our pushState. Stop the
				// event here so React's handler never runs.
				e.stopImmediatePropagation();

				const fullPath = url.pathname + url.search + url.hash;
				console.log(`Redirecting link to internal route: ${fullPath}`);

				window.history.pushState(null, '', fullPath);

				// Tell React to re-render the view
				window.dispatchEvent(new PopStateEvent('popstate'));
			}
		}
	}, true);

	/******************************************************************
	* In-thread Archive / Filter — keep them in the SPA                *
	* -----------------------------------------------------------------*
	* The bundle's thread-header controls run:                         *
	*                                                                  *
	*     preventDefault() -> await action() -> window.location = d    *
	*                                                                  *
	* That last assignment is a full cross-document navigation, so     *
	* every in-thread archive tore down the SPA and replayed the whole *
	* userscript boot — the "Please wait" screen, several seconds,     *
	* after an action that had already succeeded. window.location is   *
	* [LegacyUnforgeable], so it cannot be shadowed, proxied or        *
	* cancelled; the only way out is to stop the bundle's handler from *
	* running and drive the same work ourselves.                       *
	*                                                                  *
	* Crucially this does NOT reimplement archiving. The action the    *
	* bundle passes to the control is the ThreadViewerHeader's own     *
	* onArchive / onFilter prop, which we recover by walking up the    *
	* React fiber from the clicked anchor. Calling it runs the real    *
	* thunk — same REST call, same dispatches, same toast — leaving    *
	* the store in exactly the state a queue-side archive produces.    *
	* Only the navigation is ours, and it uses pushState like every    *
	* other in-app link.                                               *
	*                                                                  *
	* Only Archive and "Filter Conversation" are affected: they are    *
	* the only two controls the bundle renders as <a> with a redirect  *
	* target. Unarchive, Unfilter, Highlight and Mark-read render as   *
	* <button> and never navigated in the first place.                 *
	******************************************************************/
	(function () {
		// React 16 (this bundle) uses __reactInternalInstance$; 17+ renamed it.
		const FIBER_KEY_PREFIXES = ['__reactFiber$', '__reactInternalInstance$'];

		function getFiber(node) {
			const key = Object.keys(node).find(
				k => FIBER_KEY_PREFIXES.some(prefix => k.startsWith(prefix))
			);
			return key ? node[key] : null;
		}

		// The action lives on an ancestor component's props, not on the anchor.
		function findHandler(node, propName) {
			for (let fiber = getFiber(node); fiber; fiber = fiber.return) {
				const handler = fiber.memoizedProps?.[propName];
				if (typeof handler === 'function') return handler;
			}
			return null;
		}

		// Identify the control by its icon class rather than its visible text.
		// Note the "_fill" variants (icon-archived_fill = Unarchive, icon-spam_fill
		// = Unfilter) are separate class names and deliberately do not match here.
		function propNameFor(anchor) {
			if (anchor.querySelector('.icon-archived')) return 'onArchive';
			if (anchor.querySelector('.icon-spam')) return 'onFilter';
			return null;
		}

		document.addEventListener('click', (e) => {
			if ((e.button ?? 0) !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

			const anchor = e.target.closest?.('a.ThreadViewerHeader__control');
			if (!anchor) return;

			const propName = propNameFor(anchor);
			if (!propName) return;

			const handler = findHandler(anchor, propName);
			if (!handler) {
				// Never trade a working action for a broken one: if the fiber walk
				// comes up empty (bundle swapped, React internals renamed), fall
				// through and let the bundle reload the page as it always did.
				console.warn(`[modmail] No ${propName} prop on the fiber; falling back to the bundle's reload.`);
				return;
			}

			// The anchor's href is exactly the folder the bundle would navigate to,
			// so there is no need to recompute it from mailType.
			let folder = null;
			try { folder = new URL(anchor.href).pathname; } catch (err) { /* keep null */ }

			e.preventDefault();
			e.stopImmediatePropagation();

			Promise.resolve()
				.then(() => handler())
				.then(() => {
					if (!folder) return;
					console.log(`In-thread ${propName} complete; routing to ${folder} without a reload.`);
					window.history.pushState(null, '', folder);
					window.dispatchEvent(new PopStateEvent('popstate'));
				})
				.catch((err) => {
					// The thunk raises its own error toast. Stay in the thread rather
					// than navigating away from an action that did not happen.
					console.error(`[modmail] In-thread ${propName} failed:`, err);
				});
		}, true);
	})();

	/******************************************************************
	* External-link host rewriter                                      *
	* -----------------------------------------------------------------*
	* The upstream Modmail React bundle hardcodes https://www.reddit  *
	* .com/... in anchor hrefs for usernames, subreddits, wiki, etc.  *
	* Those should follow the user's "external link host" preference  *
	* (set by the userscript via window.__MODMAIL_EXTERNAL_LINK_HOST__) *
	* — typically old.reddit.com so /r and /u links open in the old   *
	* UI even when modmail itself is being served from mod.reddit.com *
	* (where /r and /u 404) or www.reddit.com (current UI).           *
	*                                                                  *
	* Strategy: rewrite at insertion time (MutationObserver), not on  *
	* click. This means every downstream consumer — left-click,       *
	* middle-click, ctrl-click, Enter key, right-click "Copy link",   *
	* hover preview, drag-to-new-window — sees the corrected href.    *
	* No event-timing race.                                            *
	*                                                                  *
	* If the userscript hasn't set the global (older versions, or     *
	* somebody injecting clientRecover standalone), we fall back to   *
	* the current location.host — the v1.2.2/v1.2.3 behavior.         *
	******************************************************************/
	(function () {
		const HOSTS_TO_REWRITE = new Set(['www.reddit.com', 'mod.reddit.com']);

		function getExternalLinkHost() {
			return window.__MODMAIL_EXTERNAL_LINK_HOST__ || window.location.host;
		}

		function rewriteAnchor(a) {
			if (!a.href) return;
			let url;
			try { url = new URL(a.href); } catch { return; }
			// Internal modmail links are handled by the click handler above via pushState.
			if (url.pathname.startsWith('/mail/')) return;
			// Only rewrite the two hosts the upstream bundle hardcodes.
			// Leave out.reddit.com (click tracker), i.redd.it / v.redd.it / preview.redd.it
			// (media CDNs), and any external domains alone.
			if (!HOSTS_TO_REWRITE.has(url.host)) return;
			const target = getExternalLinkHost();
			if (url.host === target) return; // already correct
			url.host = target;
			a.setAttribute('href', url.toString());
		}

		function scan(root) {
			if (!root || root.nodeType !== 1) return;
			if (root.tagName === 'A') rewriteAnchor(root);
			root.querySelectorAll && root.querySelectorAll('a[href]').forEach(rewriteAnchor);
		}

		const obs = new MutationObserver((muts) => {
			for (const m of muts) {
				if (m.type === 'childList') {
					m.addedNodes.forEach(scan);
				} else if (m.type === 'attributes' && m.target.tagName === 'A') {
					rewriteAnchor(m.target);
				}
			}
		});
		// Scope to #container (the React root) rather than <body>. Everything the
		// bundle renders lives inside it, while the userscript's own chrome — the
		// draggable "New Modmail" button, its settings panel, the brand badge —
		// sits directly on <body> and has no anchors worth rewriting. Falls back
		// to <body> if the loader markup isn't present.
		const rewriteRoot = document.getElementById('container') || document.body;

		obs.observe(rewriteRoot, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['href']
		});

		// Catch any anchors already in the DOM at script-load time.
		scan(rewriteRoot);
	})();

	if (!(location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
		console.warn("Non-localhost detected: Neutralizing GQL WebSocket to prevent connection spam.");

		window.WebSocket = class {
			constructor(url) {
				this.url = url;
				this.readyState = 0;
				this.onopen = null;
				this.onclose = null;
				this.onerror = null;
				this.onmessage = null;
			}
			send(data) { console.warn("Blocked WS Send:", data); }
			close() { this.readyState = 3; }
			addEventListener() {}
			removeEventListener() {}
			dispatchEvent() { return false; }
		};

		Object.assign(window.WebSocket, {
			CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3
		});
	}


	/**********************
	* gql.reddit.com fix  *
	***********************/
	const debugDumpState = (name) => {
		const {
			platform: {
				currentPage: {
					urlParams: { threadId, messageId },
				},
			},
			threads,
			threadUsers,
			modNotes,
			messages,
		} = store.getState();

		console.debug("State dump "+name, {
			threadId, messageId,
			thread: threads.data[threadId],
			user: threadUsers[threadId],
			modNotes: modNotes.data[threadId],
			messages: messages.data[messageId],
		});
	};

	const modNoteVars = { 
		includePostContentPostHint: false,
		includePostContentThumbnailEnabled: false,
		includeSubredditInPosts: false,
		includeAwards: false,
		includeCommunityStatus: false,
	};

	const modNoteCountKeyMap = {
		all: 'ALL',
		approval: 'APPROVAL',
		ban: 'BAN',
		contentChange: 'CONTENT_CHANGE',
		invite: 'INVITE',
		modAction: 'MOD_ACTION',
		mute: 'MUTE',
		note: 'NOTE',
		removal: 'REMOVAL',
		spam: 'SPAM'
	};

	const idMap = {
		"f1e1e31a0a45": { // Thank you https://www.reddit.com/user/RVL-003/ for finding GetRedditUsersByIds
			operationName: "GetRedditUsersByIds", // old: RedditorsInfoByIds
			async process(variables) {
				const redditor = (await gqlFetch(
					"GetRedditUsersByIds", "c4332a3bb82908fc1383b8e44132c2e12e2104f8cf4256f09df96fdf110a6a1f",
					{ ...variables, includePremiumAvatarTreatment: false },
					{ cache: true, maxCacheAge: -1 }
				)).redditorsInfoByIds[0];

				if (window.__MODREDDITCOM_REVIVED__["loadTrophyData"]) {
					redditor.trophies = (
						await getJSON(`/user/${redditor.displayName}/trophies`, { cache: true, maxCacheAge: -1 })
					).data.trophies.map(
						({ data }) => ({
							icon40Url: data.icon_40,
							grantedAt: data.granted_at,
							name: data.name,
							awardId: "t6_"+data.award_id,
							trophyId: "rd_"+data.id,
						})
					)
				} else if (redditor.isVerified) {
					// Fake trophy data to avoid a fetch
					redditor.trophies = [{
						"__typename": "Trophy",
						"description": null,
						"icon40Url":"https://www.redditstatic.com/awards2/verified_email-40.png",
						"grantedAt": redditor.profile.createdAt,
						"name": "Verified Email",
						"trophyId":"rd_4nt95e",
						"awardId":"t6_o",
						"url": null
					}]
				}
				return JSON.stringify({ data: { redditorsInfoByIds: [ redditor ] }});
			}
		},
		"14b7366f7468": {
			operationName: "GetSavedResponses", // old: GetSavedResponses
			sha256Hash: "19afbcb3f5112b906f7959b3a635615851fc76cc061ca9c3acd84d613f4bd53e",
			options: { cache: true }
		},
		"9602ad942f3c": {
			operationName: "RenderSavedResponse", // old: RenderSavedResponseTemplate
			async process({ id: responseId, subredditName, variables: templateVariables, ...otherVariables }) {
				const mappedVariables = {
					responseId, templateVariables,
					subredditId: await getSubredditIdFromName(subredditName),
					...otherVariables
				}
				const { subredditInfoById } = await gqlFetch("RenderSavedResponse", "c5412288fe3f34e7fac48690c36ea112869eb2ff88cbf134a126bc04f0fd3a0d", mappedVariables);
				return JSON.stringify({ data: { subredditInfoByName: subredditInfoById }});
			}
		},
		"3100a52e1cad": {
			operationName: "GetModUserNotes",
			async process({ subredditId, userId, filter, last, ...otherVariables }) {
				// if the client is trying to get most recent note
				// (note that the original devs probably forgot to use {"filter": "NOTE"} and uses "ALL". I'm fixing it)
				if (last === 1) {
					// Why am I using the REST endpoint? Because it completes in ~500ms compared to ~7 seconds for GraphQL.
					// Something is very wrong with the GraphQL endpoint for this. Old is gold in this case
					// I'm going to leave this commented out until Reddit fixes their GraphQL endpoint, then we can switch back to it.

					/* return await gqlFetch(
						"GetModUserLogs", // older one "GetModUserNotes" doesn't support "last" variable
						"a28dccb3fbc22447bc1555aaf67e2280de261027f0397b0ef7c999639e812796",
						{
							subredditId, userId, filter: "NOTE", last: 1,
							includePostContentPostHint: false, includePostContentThumbnailEnabled: false
						},
						false
					) */
					const {
						platform: {
							currentPage: {
								urlParams: { threadId },
							},
						},
						threads: { data: threads },
					} = store.getState();
					const {
						owner: { displayName: subreddit },
						participant: { name: user },
					} = threads[threadId];

					if (user === "[deleted]")
						return '{"data":{"subredditInfoById":{"modNotes":{"pageInfo":{"startCursor":null,"endCursor":null,"hasNextPage":false,"hasPreviousPage":false},"edges":[],"totalCount":0}}}}';

					const { mod_notes, start_cursor, end_cursor, has_next_page } = await getJSON(
						`/api/mod/notes?filter=NOTE&limit=1&user=${user}&subreddit=${subreddit}`,
					);

					return JSON.stringify({
						data: {
							subredditInfoById: {
								__typename: "Subreddit",
								modNotes: {
									pageInfo: {
										startCursor: start_cursor,
										endCursor: end_cursor,
										hasNextPage: has_next_page,
										hasPreviousPage: false,
									},
									edges: mod_notes.map((note) => ({
										cursor: note.cursor,
										node: {
											__typename: "ModUserNote",
											id: note.id.slice(8), // remove "ModNote_" prefix
											createdAt: new Date(note.created_at * 1000).toISOString(),
											itemType: note.type,
											operator: {
												id: "t2_" + note.operator_id,
												displayName: note.operator,
											},
											user: {
												id: "t2_" + note.user_id,
												displayName: note.user,
											},
											label: note.user_note_data.label,
											note: note.user_note_data.note,
										},
									})),
									totalCount: mod_notes.length, // REST endpoint doesn't return total count, so just return the count of the current page (which is 1 in this case)
								},
							},
						},
					});
				} else {
					return await gqlFetch(
						"GetModUserNotes", // older one so that post titles don't break (also is much faster)
						"9e56625bc7cad25002dbc418aa878144356cccbd2cd7c6eb64e4ab30f9146f41",
						{ subredditID: subredditId, userID: userId, filter, last, ...otherVariables },
						{ parseJSON: false }
					);
				}
			}
		},
		"4a81e80bc4df": {
			operationName: "CreateModUserNote", // old: CreateModUserNote
			sha256Hash: "bb632d3522ce761dcf90fc3bf813363089928a335b73fd2c7b84f285d3665312",
			extraVars: modNoteVars
		},
		"06ff4f0ae50b": {
			operationName: "DeleteModUserLog", // old: DeleteModUserNote
			sha256Hash: "b918cff8c862bcf959ff21a69ffafb5d72c865b305c4121c0a0c8c6f363956ca",
		},
		"fa09b6709673": {
			operationName: "GetModUserLogsCounts", // old: GetTotalModNoteCount
			async process(variables) {
				if (!variables.userId) return '{"data":{"subredditInfoById":{}}}';
				let { subredditInfoById } = await gqlFetch("GetModUserLogsCounts", "0b218eeab977b9178243552e831592d20ea1c59e72327867182faff65d1deba6", variables);
				delete subredditInfoById["__typename"];

				subredditInfoById = Object.fromEntries(
					Object.entries(subredditInfoById).map(
						([k, v]) => ([modNoteCountKeyMap[k], v])
					)
				);
				return JSON.stringify({ data: { subredditInfoById }});
			}
		}
	};

	/** Return a JSON string response from the new gql-fed.reddit.com endpoint instead of the old gql.reddit.com */
	async function gqlCompatibilityWrapper({ id, variables }) {
		const gqlFedMap = idMap[id];
		if (!gqlFedMap) {
			nativeError({
				message: "Critical error",
				submessage: "Details copied to clipboard. Please send it to u/Littux (No gql-fed mapping found for id '"+id+"')",
				throwError: false
			});
			await navigator.clipboard.writeText(JSON.stringify({ id, variables, host: location.host }));
			return '{"data":{"subredditInfoById":{},"subredditInfoByName":{},"redditorInfoById":{},"redditorInfoByName":{},"redditorsInfoByIds":[{}],"identity":{}}}';
		}
		console.log("Mapping old gql.reddit.com id '"+id+"' => gql-fed.reddit.com '"+gqlFedMap.operationName+"'");
		if (window.__clientDebug) debugDumpState(gqlFedMap.operationName);

		if (typeof gqlFedMap.process === "function") return await gqlFedMap.process(variables);
		if (gqlFedMap.extraVars) Object.assign(variables, gqlFedMap.extraVars);
		return await gqlFetch(gqlFedMap.operationName, gqlFedMap.sha256Hash, variables, { parseJSON: false, ...(gqlFedMap.options ?? {}) });
	};

/* GraphQL endpoint is unreliable and lies about status, so it has been disabled
	async function bulkEndpointBugfix(request, xhrUrl) {
		const parsedRequest = Object.fromEntries(new URLSearchParams(request));
		const conversationIds = parsedRequest.conversationIds.split(",");
		if (parsedRequest.archive) {
			await gqlFetch(
				"SetModmailConversationsArchiveStatus",
				"5406bd838f9af11acd7ae2c6ae546c53ff05ba51d73a8c3d63bd1f5ffeedaf00",
				{ input: { conversationIds, archive: JSON.parse(parsedRequest.archive) } }
			);
			return "{}";
		} else if (parsedRequest.highlight) {
			await gqlFetch(
				"SetModmailConversationsHighlightStatus",
				"6bbac1eacd96393bc63cee01eacea7bc8932913129e3baca0d67d10f852da20c",
				{ input: { conversationIds, highlight: JSON.parse(parsedRequest.highlight) } }
			);
			return "{}";
		};

		const url = new URL(xhrUrl);
		// [ "", "api", "mod", "conversations", "read" | "unread" ]
		const parts = url.pathname.split("/");
		if (parts.length === 5) {
			await gqlFetch(
				"SetModmailConversationsReadStatus",
				"2590f6097d5b81be31f84892cc8e26ce22ea0a6ea12fd956f766413255b731fd",
				{ input: { conversationIds, markRead: parts[4] === "read" } }
			);
			return "{}";
		} else {
			throw new Error("Broke stuff instead of fixing")
		}
	};
*/

	async function bulkEndpointBugfix(request, xhrUrl) {
		const parsedRequest = Object.fromEntries(new URLSearchParams(request));
		const allIds = parsedRequest.conversationIds.split(",");

		// Returns errors when more than 50
		const CHUNK_SIZE = 50;
		const chunks = [];
		for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
			chunks.push(allIds.slice(i, i + CHUNK_SIZE));
		}

		console.log(`Sequential Processing: ${chunks.length} chunks...`);

		let failedChunks = 0;

		for (const [index, chunk] of chunks.entries()) {
			const body = new URLSearchParams(parsedRequest);
			body.set("conversationIds", chunk.join(","));

			nativeToast({
				message: "Bulk action",
				submessage: `Processing chunk ${index + 1}/${chunks.length} with ${chunk.length} items...`,
				timeout: false,
			});

			try {
				const response = await fetch(xhrUrl, {
					method: "POST",
					body: body,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"Authorization": "Bearer " + await getToken()
					},
				});

				// throwError:false — nativeError() throws by default, and this call
				// sits inside the try, so an HTTP failure used to be caught below
				// and re-reported as a "Network error", hiding the real status code
				// behind a second, wrong toast.
				if (!response.ok) {
					failedChunks++;
					nativeError({
						message: "Bulk action error",
						submessage: `Chunk ${index + 1} failed: ${response.status}`,
						throwError: false
					});
				}
			} catch (err) {
				failedChunks++;
				nativeError({
					message: "Bulk action error",
					submessage: `Network error on chunk ${index + 1}: ${err}`,
					throwError: false
				})
			}

			if (index < chunks.length - 1)
				await new Promise(resolve => setTimeout(resolve, 500));
		}

		// Clear once at the end. Doing this per-iteration wiped any error toast
		// raised in the same iteration ~0ms after it appeared; the progress toast
		// needs no explicit clearing because nativeToast/nativeError each clear
		// the previous one first.
		clearNativeToast();

		console.log("Bulk sequence finished.");

		// Neither branch above aborts any more, so a transient failure on one
		// chunk no longer strands the chunks behind it. Still report upward, so
		// the bundle doesn't optimistically mark the whole selection as done.
		if (failedChunks)
			throw new Error(`Bulk action failed on ${failedChunks} of ${chunks.length} chunk(s)`);

		return JSON.stringify({});
	}

	async function refreshProxyResponse() {
		console.log("Creating fake /refreshproxy response");
		await getToken();
		return JSON.stringify({
			session: {
				tokenType: "RSSG",
				accessToken: window.tokenCache.token,
				expires: window.tokenCache.expires
			}
		})
	}

	async function createFakeXHR(xhr, dataFunction) {
		let jsonResponse;
		try {
			jsonResponse = await dataFunction();
		} catch (e) {
			// xhr.send() fires this without awaiting, so a rejection here used to
			// mean no load/error/loadend event was ever dispatched — superagent
			// then waited forever and the UI sat on a spinner with nothing but an
			// unhandled rejection in the console. nativeError() throws by default,
			// so this path is reached routinely. Surface it as a network-style
			// failure (status 0) instead.
			console.error("Fake XHR handler failed:", e);
			Object.defineProperties(xhr, {
				status: { value: 0 },
				statusText: { value: "" },
				readyState: { value: 4 },
				responseText: { value: "" },
				response: { value: "" },
				responseURL: { value: xhr._url },
				withCredentials: { value: true }
			});
			xhr.dispatchEvent(new Event('readystatechange'));
			xhr.dispatchEvent(new Event('error'));
			xhr.dispatchEvent(new Event('loadend'));
			return;
		}

		// Superagent checks these specifically
		Object.defineProperties(xhr, {
			status: { value: 200 },
			statusText: { value: "OK" },
			readyState: { value: 4 },
			responseText: { value: jsonResponse },
			response: { value: jsonResponse },
			// Superagent uses this to decide if the request was successful
			responseURL: { value: xhr._url },
			withCredentials: { value: true }
		});

		// Superagent won't parse the body unless it sees this header
		xhr.getResponseHeader = function (header) {
			if (header.toLowerCase() === 'content-type') {
				return 'application/json; charset=utf-8';
			}
			return null;
		};

		xhr.getAllResponseHeaders = function () {
			return "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-cache\r\n";
		};

		// Manually trigger the progress and load events in order
		xhr.dispatchEvent(new Event('loadstart'));
		xhr.dispatchEvent(new Event('progress'));
		xhr.dispatchEvent(new Event('readystatechange'));
		xhr.dispatchEvent(new Event('load'));
		xhr.dispatchEvent(new Event('loadend'));
	}

	const OldXHR = window.XMLHttpRequest;
	const bulkActionURLs = new Set([
		"/api/mod/conversations/read", "/api/mod/conversations/unread",
		"/api/mod/conversations/archive", "/api/mod/conversations/highlight"
	]);

	function NewXHR() {
		const xhr = new OldXHR();

		const send = xhr.send;
		xhr.send = function (data) {
			if (this._url && this._method === "POST") {
				if (this._url === "/refreshproxy?redditWebClient=modmail") {
					createFakeXHR(this, refreshProxyResponse);
					return;
				}

				// Base argument: the bundle uses absolute oauth.reddit.com URLs today,
				// but a relative URL here would make bare new URL() throw and kill send().
				const url = new URL(this._url, window.location.origin);

				if (url.hostname === 'gql.reddit.com') {
					createFakeXHR(this, () => gqlCompatibilityWrapper(JSON.parse(data)));
					return;
				} else if (bulkActionURLs.has(url.pathname)) {
					createFakeXHR(this, () => bulkEndpointBugfix(data, this._url));
					return;
				}
			}
			return send.apply(this, arguments);
		};

		// We need to capture the URL from the .open() call
		const open = xhr.open;
		xhr.open = function (method, url) {
			this._url = url;
			this._method = method;
			return open.apply(this, arguments);
		};

		return xhr;
	}

	// NewXHR returns a real XMLHttpRequest rather than initialising `this`, so it
	// carries none of the constructor's public surface by default. Restore the
	// two pieces callers actually reach for: the prototype (so
	// `x instanceof XMLHttpRequest` still holds — libraries feature-detect with
	// it) and the readyState constants (`XMLHttpRequest.DONE` and friends, which
	// are otherwise undefined and silently compare unequal to every readyState).
	NewXHR.prototype = OldXHR.prototype;
	Object.assign(NewXHR, {
		UNSENT: 0,
		OPENED: 1,
		HEADERS_RECEIVED: 2,
		LOADING: 3,
		DONE: 4
	});

	window.XMLHttpRequest = NewXHR;
};

if (window.__MODREDDITCOM_REVIVED__) {
	main(__MODREDDITCOM_REVIVED__["event"])
} else {
	console.log("Waiting for rAPI-accessToken-ready...");
	window.addEventListener('rAPI-accessToken-ready', main);
	setTimeout(() => {
		if (!window.gmFetch) {
			logInitStatus(`<a
				href="https://greasyfork.org/en/scripts/570323-mod-reddit-com-revived"
				target="_blank"
			>This userscript</a> needs to be installed for this to work.`, true);
		}
	}, 4000);
};