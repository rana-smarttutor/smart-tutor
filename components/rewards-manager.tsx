"use client";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Banknote,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  History,
  IndianRupee,
  Landmark,
  Loader2,
  RefreshCw,
  Smartphone,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  EducatorReferral,
  EducatorRewardDashboard,
  RewardPaymentMethod,
  RewardRedemption,
  RewardTransaction,
} from "@/lib/reward-types";

type RewardsManagerProps = {
  className?: string;
};

type RewardApiResponse = {
  success?: boolean;
  dashboard?: EducatorRewardDashboard;
  error?: string;
};

type RedemptionApiResponse = {
  success?: boolean;
  message?: string;
  redemption?: RewardRedemption;
  error?: string;
};

type RewardTab =
  | "referrals"
  | "transactions"
  | "redemptions";

type RedemptionFormState = {
  amount: string;

  paymentMethod: RewardPaymentMethod;

  upiId: string;

  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
};

const EMPTY_REDEMPTION_FORM: RedemptionFormState = {
  amount: "",
  paymentMethod: "upi",

  upiId: "",

  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
};

function formatMoney(value: number) {
  return `₹${Math.max(0, value).toLocaleString(
    "en-IN",
  )}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getReferralStatusDetails(
  status: EducatorReferral["status"],
) {
  switch (status) {
    case "registered":
      return {
        label: "Registered",
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "pending_enrollment":
      return {
        label: "Pending Enrollment",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "pending_payment":
      return {
        label: "Pending Payment",
        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "successful":
      return {
        label: "Successful",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "border-rose-200 bg-rose-50 text-rose-700",
      };

    case "reversed":
      return {
        label: "Reward Reversed",
        className:
          "border-slate-300 bg-slate-100 text-slate-700",
      };

    default:
      return {
        label: status,
        className:
          "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function getRedemptionStatusDetails(
  status: RewardRedemption["status"],
) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "approved":
      return {
        label: "Approved",
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "paid":
      return {
        label: "Paid",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "rejected":
      return {
        label: "Rejected",
        className:
          "border-rose-200 bg-rose-50 text-rose-700",
      };

    default:
      return {
        label: status,
        className:
          "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function getTransactionDetails(
  transaction: RewardTransaction,
) {
  const isCredit =
    transaction.type === "referral_credit" ||
    transaction.type === "redemption_release" ||
    transaction.type === "manual_credit";

  return {
    isCredit,

    sign: isCredit ? "+" : "−",

    amountClassName: isCredit
      ? "text-emerald-600"
      : "text-rose-600",

    iconClassName: isCredit
      ? "bg-emerald-50 text-emerald-600"
      : "bg-rose-50 text-rose-600",
  };
}



async function copyText(value: string) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.setAttribute(
    "readonly",
    "true",
  );

  document.body.appendChild(textarea);
  textarea.select();

  document.execCommand("copy");

  textarea.remove();
}

function EmptyTableState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>

      <p className="mt-4 text-sm font-black text-slate-800">
        {title}
      </p>

      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function RewardsManager({
  className = "",
}: RewardsManagerProps) {
  const [dashboard, setDashboard] =
    useState<EducatorRewardDashboard | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<RewardTab>("referrals");

  const [
    showRedemptionModal,
    setShowRedemptionModal,
  ] = useState(false);

  const [
    redemptionForm,
    setRedemptionForm,
  ] = useState<RedemptionFormState>(
    EMPTY_REDEMPTION_FORM,
  );

  const [
    submittingRedemption,
    setSubmittingRedemption,
  ] = useState(false);

  const [copiedItem, setCopiedItem] =
    useState<"code" | null>(null);

  async function loadRewards(
    showRefreshState = false,
  ) {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        "/api/rewards",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as RewardApiResponse;

      if (
        !response.ok ||
        !payload.dashboard
      ) {
        throw new Error(
          payload.error ||
            "Unable to load rewards.",
        );
      }

      setDashboard(payload.dashboard);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load rewards.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  const summary = dashboard?.summary;

  const canRedeem =
    Boolean(
      summary?.redemptionsEnabled,
    ) &&
    (summary?.availableBalance ?? 0) >=
      (summary?.minimumRedemptionAmount ??
        1000);

  const pendingRedemptions = useMemo(
    () =>
      dashboard?.redemptions.filter(
        (redemption) =>
          redemption.status === "pending" ||
          redemption.status === "approved",
      ) ?? [],
    [dashboard?.redemptions],
  );

  const summaryCards = [
    {
      label: "Available Balance",
      value: formatMoney(
        summary?.availableBalance ?? 0,
      ),
      description:
        canRedeem
          ? "Ready to redeem"
          : `Minimum redemption ${formatMoney(
              summary?.minimumRedemptionAmount ??
                1000,
            )}`,
      icon: Wallet,
      iconClassName:
        "bg-emerald-50 text-emerald-600",
      borderClassName:
        "border-t-emerald-500",
    },
    {
      label: "Total Earned",
      value: formatMoney(
        summary?.totalEarned ?? 0,
      ),
      description: `${
        summary?.successfulReferrals ?? 0
      } successful referrals`,
      icon: BadgeIndianRupee,
      iconClassName:
        "bg-blue-50 text-blue-600",
      borderClassName:
        "border-t-blue-500",
    },
    {
      label: "Pending Rewards",
      value: formatMoney(
        summary?.pendingRewardAmount ?? 0,
      ),
      description: `${
        summary?.pendingReferrals ?? 0
      } referrals in progress`,
      icon: Clock3,
      iconClassName:
        "bg-amber-50 text-amber-600",
      borderClassName:
        "border-t-amber-500",
    },
    {
      label: "Total Referrals",
      value: String(
        summary?.totalReferrals ?? 0,
      ),
      description: `${
        summary?.successfulReferrals ?? 0
      } completed enrollments`,
      icon: Users,
      iconClassName:
        "bg-violet-50 text-violet-600",
      borderClassName:
        "border-t-violet-500",
    },
  ];

  function openRedemptionModal() {
    if (!summary) {
      return;
    }

    const suggestedAmount =
      Math.min(
        summary.availableBalance,
        Math.max(
          summary.minimumRedemptionAmount,
          1000,
        ),
      );

    setRedemptionForm({
      ...EMPTY_REDEMPTION_FORM,

      amount:
        suggestedAmount > 0
          ? String(suggestedAmount)
          : "",
    });

    setError("");
    setSuccessMessage("");
    setShowRedemptionModal(true);
  }

  function closeRedemptionModal() {
    if (submittingRedemption) {
      return;
    }

    setShowRedemptionModal(false);

    setRedemptionForm(
      EMPTY_REDEMPTION_FORM,
    );
  }

  async function handleCopyCode() {
    if (!summary?.referralCode) {
      return;
    }

    try {
      await copyText(
        summary.referralCode,
      );

      setCopiedItem("code");

      window.setTimeout(() => {
        setCopiedItem(null);
      }, 1800);
    } catch {
      setError(
        "Unable to copy the referral code.",
      );
    }
  }

  async function handleRedemptionSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !dashboard ||
      submittingRedemption
    ) {
      return;
    }

    const amount = Number(
      redemptionForm.amount,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Enter a valid redemption amount.",
      );
      return;
    }

    if (
      amount <
      dashboard.summary
        .minimumRedemptionAmount
    ) {
      setError(
        `Minimum redemption amount is ${formatMoney(
          dashboard.summary
            .minimumRedemptionAmount,
        )}.`,
      );
      return;
    }

    if (
      amount >
      dashboard.summary
        .availableBalance
    ) {
      setError(
        "The redemption amount cannot exceed your available balance.",
      );
      return;
    }

    if (
      redemptionForm.paymentMethod ===
        "upi" &&
      !redemptionForm.upiId.trim()
    ) {
      setError(
        "Enter your UPI ID.",
      );
      return;
    }

    if (
      redemptionForm.paymentMethod ===
      "bank"
    ) {
      if (
        !redemptionForm.accountHolderName.trim() ||
        !redemptionForm.accountNumber.trim() ||
        !redemptionForm.ifscCode.trim()
      ) {
        setError(
          "Complete all required bank details.",
        );
        return;
      }
    }

    setSubmittingRedemption(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/rewards/redeem",
        {
          method: "POST",
          credentials: "same-origin",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount,

            paymentMethod:
              redemptionForm.paymentMethod,

            upiId:
              redemptionForm.paymentMethod ===
              "upi"
                ? redemptionForm.upiId.trim()
                : undefined,

            bankDetails:
              redemptionForm.paymentMethod ===
              "bank"
                ? {
                    accountHolderName:
                      redemptionForm.accountHolderName.trim(),

                    accountNumber:
                      redemptionForm.accountNumber.trim(),

                    ifscCode:
                      redemptionForm.ifscCode
                        .trim()
                        .toUpperCase(),

                    bankName:
                      redemptionForm.bankName.trim() ||
                      undefined,
                  }
                : undefined,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as RedemptionApiResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Unable to submit the redemption request.",
        );
      }

      setShowRedemptionModal(false);

      setRedemptionForm(
        EMPTY_REDEMPTION_FORM,
      );

      setSuccessMessage(
        payload.message ||
          "Your redemption request has been submitted.",
      );

      setActiveTab("redemptions");

      await loadRewards(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the redemption request.",
      );
    } finally {
      setSubmittingRedemption(false);
    }
  }

  if (loading) {
    return (
      <div
        className={`flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white ${className}`}
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#0B40A1]" />

          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading rewards…
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard || !summary) {
    return (
      <div
        className={`rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center ${className}`}
      >
        <AlertCircle className="mx-auto h-9 w-9 text-rose-500" />

        <p className="mt-4 text-sm font-black text-rose-700">
          Rewards could not be loaded
        </p>

        <p className="mt-2 text-xs text-rose-600">
          {error ||
            "Please refresh and try again."}
        </p>

        <button
          type="button"
          onClick={() =>
            void loadRewards()
          }
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section
      className={`space-y-5 ${className}`}
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B40A1] via-indigo-700 to-violet-700 p-5 text-white shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />

        <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Gift size={27} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
                Educator Referral Program
              </p>

              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                Refer and Earn Rewards
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Earn{" "}
                <strong className="text-white">
                  {formatMoney(
                    summary.referralRewardAmount,
                  )}
                </strong>{" "}
                when a referred student completes
                enrollment and payment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openRedemptionModal}
            disabled={!canRedeem}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0B40A1] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IndianRupee size={18} />
            Redeem Rewards
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="flex-1">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="flex-1">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={`rounded-2xl border border-slate-200 border-t-[3px] bg-white p-4 shadow-sm sm:p-5 ${card.borderClassName}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClassName}`}
              >
                <Icon size={20} />
              </div>

              <p className="mt-4 text-xl font-black text-slate-900 sm:text-2xl">
                {card.value}
              </p>

              <p className="mt-1 text-xs font-black text-slate-700 sm:text-sm">
                {card.label}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>

      {/* Referral code */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Your Referral Code
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Share this code with the student before they register.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRewards(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 text-xs font-black text-[#0B40A1] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mx-auto max-w-xl rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-center text-[10px] font-black uppercase tracking-wider text-indigo-500">
              Referral Code
            </p>

            <p className="mt-2 break-all text-center text-2xl font-black tracking-[0.12em] text-indigo-800">
              {summary.referralCode}
            </p>

            <button
              type="button"
              onClick={handleCopyCode}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B40A1] text-sm font-black text-white transition hover:bg-[#092f78]"
            >
              {copiedItem === "code" ? (
                <>
                  <CheckCircle2 size={17} />
                  Code Copied
                </>
              ) : (
                <>
                  <Copy size={17} />
                  Copy Referral Code
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            The student must enter this code in the optional referral-code
            field during registration. The reward is credited only after the
            student&apos;s enrollment and payment are confirmed.
          </p>
        </div>
      </div>

      {/* History tabs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Rewards Activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Track referrals, wallet activity and
              redemption requests.
            </p>
          </div>

          <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
            {[
              {
                value:
                  "referrals" as const,
                label: "Referrals",
                count:
                  dashboard.referrals.length,
              },
              {
                value:
                  "transactions" as const,
                label: "Wallet History",
                count:
                  dashboard.transactions.length,
              },
              {
                value:
                  "redemptions" as const,
                label: "Redemptions",
                count:
                  dashboard.redemptions.length,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  setActiveTab(tab.value)
                }
                className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-black transition sm:px-4 sm:text-xs ${
                  activeTab === tab.value
                    ? "bg-white text-[#0B40A1] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Referral history */}
        {activeTab === "referrals" ? (
          dashboard.referrals.length === 0 ? (
            <EmptyTableState
              icon={<Users size={25} />}
              title="No referrals yet"
              description="Students who register using your referral code will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      "Student",
                      "Program",
                      "Registered On",
                      "Status",
                      "Reward",
                    ].map(
                      (
                        heading,
                        index,
                        headings,
                      ) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
                            index !==
                            headings.length - 1
                              ? "border-r border-slate-200"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {dashboard.referrals.map(
                    (referral) => {
                      const status =
                        getReferralStatusDetails(
                          referral.status,
                        );

                      return (
                        <tr
                          key={referral.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                        >
                          <td className="border-r border-slate-200 px-5 py-4">
                            <p className="text-sm font-black text-slate-900">
                              {referral.studentName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {referral.studentEmail ||
                                referral.studentMobile ||
                                "Student account"}
                            </p>
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700">
                            {referral.programTitle ||
                              "Program not selected"}
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              referral.registrationCompletedAt ||
                                referral.createdAt,
                            )}
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p
                              className={`text-sm font-black ${
                                referral.rewardCredited
                                  ? "text-emerald-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {formatMoney(
                                referral.rewardAmount,
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {referral.rewardCredited
                                ? "Credited"
                                : "Not credited"}
                            </p>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {/* Wallet history */}
        {activeTab ===
        "transactions" ? (
          dashboard.transactions.length ===
          0 ? (
            <EmptyTableState
              icon={<History size={25} />}
              title="No wallet transactions"
              description="Reward credits and redemption activity will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboard.transactions.map(
                (transaction) => {
                  const details =
                    getTransactionDetails(
                      transaction,
                    );

                  return (
                    <article
                      key={transaction.id}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 sm:px-6"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${details.iconClassName}`}
                      >
                        {details.isCredit ? (
                          <ArrowDownRight
                            size={20}
                          />
                        ) : (
                          <ArrowUpRight
                            size={20}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-800">
                          {transaction.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            transaction.createdAt,
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-black ${details.amountClassName}`}
                        >
                          {details.sign}
                          {formatMoney(
                            transaction.amount,
                          )}
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          Balance{" "}
                          {formatMoney(
                            transaction.balanceAfter,
                          )}
                        </p>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )
        ) : null}

        {/* Redemption history */}
        {activeTab ===
        "redemptions" ? (
          dashboard.redemptions.length ===
          0 ? (
            <EmptyTableState
              icon={<Banknote size={25} />}
              title="No redemption requests"
              description="Your submitted reward redemption requests will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      "Requested On",
                      "Amount",
                      "Payment Method",
                      "Status",
                      "Reference",
                    ].map(
                      (
                        heading,
                        index,
                        headings,
                      ) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
                            index !==
                            headings.length - 1
                              ? "border-r border-slate-200"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {dashboard.redemptions.map(
                    (redemption) => {
                      const status =
                        getRedemptionStatusDetails(
                          redemption.status,
                        );

                      return (
                        <tr
                          key={redemption.id}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                        >
                          <td className="border-r border-slate-200 px-5 py-4 text-sm text-slate-600">
                            {formatDateTime(
                              redemption.requestedAt,
                            )}
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4 text-sm font-black text-slate-900">
                            {formatMoney(
                              redemption.amount,
                            )}
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4">
                            <div className="flex items-center gap-2">
                              {redemption.paymentMethod ===
                              "upi" ? (
                                <Smartphone
                                  size={15}
                                  className="text-indigo-600"
                                />
                              ) : (
                                <Landmark
                                  size={15}
                                  className="text-indigo-600"
                                />
                              )}

                              <span className="text-sm font-bold uppercase text-slate-700">
                                {
                                  redemption.paymentMethod
                                }
                              </span>
                            </div>
                          </td>

                          <td className="border-r border-slate-200 px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                            {redemption.transactionReference ||
                              redemption.rejectionReason ||
                              "—"}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>

      {pendingRedemptions.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
          You currently have{" "}
          {pendingRedemptions.length} pending or
          approved redemption{" "}
          {pendingRedemptions.length === 1
            ? "request"
            : "requests"}
          .
        </div>
      ) : null}

      {/* Redemption modal */}
      {showRedemptionModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Redeem Rewards
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Available balance:{" "}
                  <strong className="text-emerald-600">
                    {formatMoney(
                      summary.availableBalance,
                    )}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={closeRedemptionModal}
                disabled={submittingRedemption}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                aria-label="Close redemption form"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={
                handleRedemptionSubmit
              }
              className="space-y-5 p-5 sm:p-6"
            >
              <div>
                <label
                  htmlFor="reward-redemption-amount"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                >
                  Amount to redeem
                </label>

                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="reward-redemption-amount"
                    type="number"
                    min={
                      summary.minimumRedemptionAmount
                    }
                    max={
                      summary.availableBalance
                    }
                    step={1}
                    value={
                      redemptionForm.amount
                    }
                    onChange={(event) =>
                      setRedemptionForm(
                        (current) => ({
                          ...current,
                          amount:
                            event.target.value,
                        }),
                      )
                    }
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  Minimum redemption:{" "}
                  {formatMoney(
                    summary.minimumRedemptionAmount,
                  )}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Payment method
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRedemptionForm(
                        (current) => ({
                          ...current,
                          paymentMethod:
                            "upi",
                        }),
                      )
                    }
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      redemptionForm.paymentMethod ===
                      "upi"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone
                      size={20}
                    />

                    <div>
                      <p className="text-sm font-black">
                        UPI
                      </p>

                      <p className="mt-0.5 text-[10px] opacity-70">
                        Receive through UPI
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRedemptionForm(
                        (current) => ({
                          ...current,
                          paymentMethod:
                            "bank",
                        }),
                      )
                    }
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      redemptionForm.paymentMethod ===
                      "bank"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Landmark size={20} />

                    <div>
                      <p className="text-sm font-black">
                        Bank
                      </p>

                      <p className="mt-0.5 text-[10px] opacity-70">
                        Bank account transfer
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {redemptionForm.paymentMethod ===
              "upi" ? (
                <div>
                  <label
                    htmlFor="reward-upi-id"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                  >
                    UPI ID
                  </label>

                  <input
                    id="reward-upi-id"
                    type="text"
                    value={
                      redemptionForm.upiId
                    }
                    onChange={(event) =>
                      setRedemptionForm(
                        (current) => ({
                          ...current,
                          upiId:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="name@bank"
                    autoComplete="off"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="reward-account-holder"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      Account holder name
                    </label>

                    <input
                      id="reward-account-holder"
                      type="text"
                      value={
                        redemptionForm.accountHolderName
                      }
                      onChange={(
                        event,
                      ) =>
                        setRedemptionForm(
                          (current) => ({
                            ...current,
                            accountHolderName:
                              event.target
                                .value,
                          }),
                        )
                      }
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reward-account-number"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      Account number
                    </label>

                    <input
                      id="reward-account-number"
                      type="text"
                      inputMode="numeric"
                      value={
                        redemptionForm.accountNumber
                      }
                      onChange={(
                        event,
                      ) =>
                        setRedemptionForm(
                          (current) => ({
                            ...current,
                            accountNumber:
                              event.target.value.replace(
                                /\D/g,
                                "",
                              ),
                          }),
                        )
                      }
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reward-ifsc"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      IFSC code
                    </label>

                    <input
                      id="reward-ifsc"
                      type="text"
                      value={
                        redemptionForm.ifscCode
                      }
                      onChange={(
                        event,
                      ) =>
                        setRedemptionForm(
                          (current) => ({
                            ...current,
                            ifscCode:
                              event.target.value
                                .toUpperCase()
                                .replace(
                                  /[^A-Z0-9]/g,
                                  "",
                                )
                                .slice(0, 11),
                          }),
                        )
                      }
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold uppercase outline-none focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="reward-bank-name"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      Bank name{" "}
                      <span className="normal-case text-slate-400">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="reward-bank-name"
                      type="text"
                      value={
                        redemptionForm.bankName
                      }
                      onChange={(
                        event,
                      ) =>
                        setRedemptionForm(
                          (current) => ({
                            ...current,
                            bankName:
                              event.target.value,
                          }),
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold leading-5 text-amber-700">
                  Your balance will be reserved
                  immediately after submitting the
                  request. It will be returned if
                  the admin rejects the redemption.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    closeRedemptionModal
                  }
                  disabled={
                    submittingRedemption
                  }
                  className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingRedemption
                  }
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B40A1] text-sm font-black text-white transition hover:bg-[#092f78] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingRedemption ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Banknote size={17} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default RewardsManager;