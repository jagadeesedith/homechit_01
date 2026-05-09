import { useState } from "react";
import { useChitFund } from "../context/ChitFundContext";
import { formatINR } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import * as XLSX from "xlsx";

interface MemberFormData {
  name: string;
  phone: string;
}

export function MemberListPage() {
  const { state, dispatch, addMember, updateMember, deleteMember } =
    useChitFund();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    phone: "",
  });
  const [isImporting, setIsImporting] = useState(false);

  const filteredMembers = state.members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.id || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      const member = state.members.find((m) => m.id === editingMember);
      if (member) {
        updateMember({ ...member, ...formData });
      }
    } else {
      addMember(formData);
    }
    setShowForm(false);
    setEditingMember(null);
    setFormData({ name: "", phone: "" });
  };

  const startEdit = (memberId: string) => {
    const member = state.members.find((m) => m.id === memberId);
    if (member) {
      setFormData({ name: member.name, phone: member.phone });
      setEditingMember(memberId);
      setShowForm(true);
    }
  };

  const handleAddNew = () => {
    setFormData({ name: "", phone: "" });
    setEditingMember(null);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const jsonData = XLSX.utils.sheet_to_json<{
        Name: string;
        Phone: string;
      }>(sheet);

      const importedMembers: {
        id: string;
        name: string;
        phone: string;
        joinDate: string;
        balance: number;
      }[] = [];

      for (const item of jsonData) {
        const name = item.Name?.toString().trim();

        const phone = item.Phone?.toString().trim();

        if (!name) continue;

        importedMembers.push({
          id: String(state.members.length + importedMembers.length + 1),

          name,

          phone: phone || "",

          joinDate: new Date().toLocaleDateString(),

          balance: 0,
        });
      }

      dispatch({
        type: "SET_STATE",

        payload: {
          members: [...state.members, ...importedMembers],
        },
      });

      alert("Members imported successfully");
    } catch (error) {
      console.error(error);

      alert("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[#1d1d1d]">
          Member List ({state.members.length})
        </h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#004b87] text-white text-sm font-medium rounded-lg hover:bg-[#003a6b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
          {isImporting ? "Importing..." : "Import Excel"}

          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-[#e9ecef] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1d1d1d]">
              {editingMember ? "Edit Member" : "Add New Member"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingMember(null);
              }}
              className="p-1 rounded hover:bg-[#f8f9fa]"
            >
              <X className="w-4 h-4 text-[#6c757d]" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                required
                placeholder="Enter member name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMember(null);
                }}
                className="px-4 py-2.5 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#004b87] text-white text-sm font-medium hover:bg-[#003a6b] transition-colors"
              >
                {editingMember ? "Update" : "Add"} Member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#e9ecef] overflow-hidden">
        <div className="p-4 border-b border-[#e9ecef]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full max-w-md pl-10 pr-4 py-2 text-sm rounded-lg border border-[#e9ecef] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e9ecef]">
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  ID
                </th>
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  Phone
                </th>
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  Join Date
                </th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  Balance
                </th>
                <th className="text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-[#6c757d]"
                  >
                    {searchQuery
                      ? "No members match your search"
                      : "No members found"}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] font-medium">
                      {member.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d]">
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c757d]">
                      {member.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6c757d]">
                      {member.joinDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right font-medium">
                      {formatINR(member.balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(member.id)}
                          className="p-1.5 rounded hover:bg-[#e9ecef] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#6c757d]" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this member?",
                              )
                            ) {
                              deleteMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-[#f8d7da] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#dc3545]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
