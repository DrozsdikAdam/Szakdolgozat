import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth";
import type { ProfileModalProps } from "../../types/common/ModalProps";
import type { UserResponse } from "../../types/user/User";
import { getMe } from "../../services/authService";
import { updateUser } from "../../services/userService";
import { NavbarModal } from "../common/modal/Navbar";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { InputField } from "../common/form/InputField";
import { SubmitButton } from "../common/form/SubmitButton";
import { validateUsername, validateEmail, validatePhoneNumber } from "../../utils/validators";
import { ArrowLeft, Edit3, LogOut, Mail, Phone, Save, ShieldCheck, User } from "lucide-react";

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
    const { logout, checkSession } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Szerkesztési állapotok
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formData, setFormData] = useState<{ username: string; email: string; phoneNumber: string }>({
        username: "",
        email: "",
        phoneNumber: ""
    });
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setSaveError(null);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);
        setIsEditing(false);
        setSaveError(null);

        getMe()
            .then((data) => {
                if (isMounted) {
                    setProfile(data);
                    setFormData({
                        username: data.username || "",
                        email: data.email || "",
                        phoneNumber: data.phoneNumber || ""
                    });
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Hiba történt a profil betöltésekor");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    const handleStartEdit = () => {
        if (!profile) return;
        setFormData({
            username: profile.username || "",
            email: profile.email || "",
            phoneNumber: profile.phoneNumber || ""
        });
        setSaveError(null);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                username: profile.username || "",
                email: profile.email || "",
                phoneNumber: profile.phoneNumber || ""
            });
        }
        setSaveError(null);
        setIsEditing(false);
    };

    const isValid = (): boolean => {
        const err = validateUsername(formData.username)
            || validateEmail(formData.email)
            || validatePhoneNumber(formData.phoneNumber, false);

        if (err) {
            setSaveError(err);
            return false;
        }
        return true;
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!profile || !isValid()) return;

        setSaveError(null);
        setIsSaving(true);

        try {
            const updated = await updateUser(profile.id, {
                username: formData.username.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                roles: profile.roles,
                active: profile.active
            });

            setProfile(updated);
            await checkSession();
            setIsEditing(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Hiba történt a profil mentésekor");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
        navigate("/login");
    };

    if (!isOpen) return null;

    return (
        <NavbarModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                isEditing ? (
                    <span className="flex items-center gap-2">
                        <Edit3 size={16} className="text-indigo-400" />
                        <span>Profil szerkesztése</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <User size={16} className="text-indigo-400" />
                        <span>Felhasználói Profil</span>
                    </span>
                )
            }
            headerRight={
                profile && !isLoading && !error && (
                    <button
                        onClick={isEditing ? handleCancelEdit : handleStartEdit}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1 text-xs cursor-pointer"
                        title={isEditing ? "Vissza a profilhoz" : "Profil szerkesztése"}
                    >
                        {isEditing ? <ArrowLeft size={16} /> : <Edit3 size={16} />}
                    </button>
                )
            }
            bodyClassName="p-4 space-y-4"
        >
            {isLoading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2">
                    <LoadingSpinner />
                    <span className="text-xs text-slate-400">Profil adatok betöltése...</span>
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                    {error}
                </div>
            ) : profile ? (
                isEditing ? (
                    <form onSubmit={handleSave} className="space-y-3.5">
                        <InputField
                            label="Felhasználónév"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />

                        <InputField
                            label="E-mail cím"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />

                        <InputField
                            label="Telefonszám"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="+36301234567"
                        />

                        {saveError && (
                            <p className="text-rose-400 text-xs font-medium text-center pt-1 animate-in fade-in duration-200">
                                {saveError}
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                            <SubmitButton
                                type="button"
                                variant="secondary"
                                onClick={handleCancelEdit}
                                text="Mégse"
                                className="px-3.5 py-1.5 rounded-xl text-xs"
                            />
                            <SubmitButton
                                type="submit"
                                loading={isSaving}
                                icon={<Save size={14} />}
                                text="Mentés"
                                className="px-4 py-1.5 rounded-xl text-xs"
                                variant="primary"
                            />
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20 shrink-0">
                                {profile.username ? profile.username.charAt(0).toUpperCase() : <User size={20} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-base font-bold text-white tracking-tight truncate">
                                    {profile.username}
                                </span>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${profile.active
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                            }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${profile.active ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                                                }`}
                                        />
                                        {profile.active ? "Aktív fiók" : "Inaktív fiók"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-800/30 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden text-xs">
                            <div className="flex items-center justify-between p-3 gap-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail size={15} className="text-slate-400 shrink-0" />
                                    <span>Email</span>
                                </div>
                                <span className="font-medium text-slate-200 truncate max-w-50" title={profile.email}>
                                    {profile.email || "Nincs megadva"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 gap-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone size={15} className="text-slate-400 shrink-0" />
                                    <span>Telefonszám</span>
                                </div>
                                <span className="font-medium text-slate-200 truncate" title={profile.phoneNumber || undefined}>
                                    {profile.phoneNumber || "Nincs megadva"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <ShieldCheck size={14} className="text-indigo-400" />
                                <span>Hozzárendelt Szerepkörök</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {profile.roles && profile.roles.length > 0 ? (
                                    profile.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="badge-indigo text-xs py-1 px-2.5 rounded-lg font-semibold"
                                        >
                                            {role}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-500">Nincsenek szerepkörök</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 transition-all duration-200 cursor-pointer shadow-sm"
                            >
                                <LogOut size={16} />
                                <span>Kijelentkezés</span>
                            </button>
                        </div>
                    </>
                )
            ) : null}
        </NavbarModal>
    );
};