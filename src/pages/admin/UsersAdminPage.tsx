import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Crown,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { User, Role } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import GrantVipModal from "../../components/admin/GrantVipModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function UsersAdminPage() {
  const [, setDbVersion] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>("ALL");
  const [grantVipTarget, setGrantVipTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Create User modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("+255");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("pass1234");
  const [createRole, setCreateRole] = useState<Role>("USER");
  const [createError, setCreateError] = useState("");

  // Edit User modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("USER");

  useEffect(() => {
    setUsers(db.users.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setUsers(db.users.findMany());
    });
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== "ALL" && u.role !== selectedRole) return false;
      if (selectedSubStatus !== "ALL" && u.subscriptionStatus !== selectedSubStatus) return false;
      return true;
    });
  }, [users, selectedRole, selectedSubStatus]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!createName.trim() || !createEmail.trim()) {
      setCreateError("Name and email are required.");
      return;
    }

    if (db.users.findByEmail(createEmail.trim())) {
      setCreateError("A user with this email already exists.");
      return;
    }

    db.users.create({
      name: createName.trim(),
      phone: createPhone.trim() || "+255700000000",
      email: createEmail.trim(),
      password: createPassword,
      role: createRole,
      subscriptionStatus: "FREE_TIER",
    });

    setIsCreateOpen(false);
    setCreateName("");
    setCreateEmail("");
    setCreatePhone("+255");
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    db.users.update(editingUser.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      role: editRole,
    });

    setEditingUser(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.users.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  function toggleRole(user: User) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    db.users.updateRole(user.id, nextRole);
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "User Details",
      sortable: true,
      cell: (u) => (
        <div>
          <div className="font-bold text-deep-green text-sm flex items-center gap-1.5">
            <span>{u.name}</span>
            {u.role === "ADMIN" && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                Admin
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3" />
            <span>{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone Number",
      sortable: true,
      cell: (u) => (
        <div className="font-mono text-xs text-ink flex items-center gap-1">
          <Phone className="h-3 w-3 text-muted" />
          <span>{u.phone || "—"}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Access Role",
      align: "center",
      width: "120px",
      cell: (u) => (
        <button
          onClick={() => toggleRole(u)}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            u.role === "ADMIN"
              ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
              : "bg-sand text-muted hover:text-ink hover:bg-sand/70"
          }`}
          title="Click to toggle ADMIN / USER role"
        >
          {u.role === "ADMIN" ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
          <span>{u.role}</span>
        </button>
      ),
    },
    {
      id: "subscriptionStatus",
      header: "VIP Status",
      align: "center",
      width: "130px",
      cell: (u) => {
        const isActive = u.subscriptionStatus === "ACTIVE";
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive
                ? "bg-emerald-100 text-emerald-800"
                : u.subscriptionStatus === "EXPIRED"
                ? "bg-sand text-muted"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {isActive && <Crown className="h-3 w-3 text-gold-dark fill-gold" />}
            <span>{u.subscriptionStatus || "FREE_TIER"}</span>
          </span>
        );
      },
    },
    {
      id: "createdAt",
      header: "Joined",
      align: "right",
      width: "100px",
      cell: (u) => (
        <span className="text-[11px] text-muted">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "140px",
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setGrantVipTarget(u)}
            className="flex items-center gap-1 bg-gold hover:bg-gold-light text-deep-green text-[10px] font-bold px-2 py-1 rounded-lg transition shadow-xs cursor-pointer"
            title="Grant VIP Subscription"
          >
            <Crown className="h-3 w-3" />
            <span>Grant VIP</span>
          </button>
          <button
            onClick={() => {
              setEditingUser(u);
              setEditName(u.name);
              setEditPhone(u.phone || "");
              setEditEmail(u.email);
              setEditRole(u.role);
            }}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 hover:text-deep-green transition cursor-pointer"
            title="Edit User"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(u)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete User"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            User Management & Roles
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.4 User Schema · Manage user accounts, phone login credentials, admin privileges, and VIP grants.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-gold-light" />
          <span>New User</span>
        </button>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by name, email, or phone..."
        searchFilter={(u, q) =>
          Boolean(
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q))
          )
        }
        filterSlot={
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins Only</option>
              <option value="USER">Standard Users</option>
            </select>

            <select
              value={selectedSubStatus}
              onChange={(e) => setSelectedSubStatus(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All VIP Statuses</option>
              <option value="ACTIVE">Active VIP</option>
              <option value="EXPIRED">Expired VIP</option>
              <option value="FREE_TIER">Free Tier</option>
            </select>
          </div>
        }
      />

      {/* Grant VIP Modal */}
      {grantVipTarget && (
        <GrantVipModal
          user={grantVipTarget}
          isOpen={Boolean(grantVipTarget)}
          onClose={() => setGrantVipTarget(null)}
        />
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green">Create User Account</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              {createError && (
                <div className="text-[12px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Salim Ali"
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Phone (Primary Login) *
                  </label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    required
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-mono text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Role
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Password
                </label>
                <input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-mono text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green">Edit User Profile</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-mono text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete User "${deleteTarget?.name}"?`}
        message="This will delete the user account and associated subscription records."
        confirmLabel="Delete User"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
