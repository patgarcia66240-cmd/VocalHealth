import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronDown, Plus, UserCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { PatientProfile } from "../types";
import { calculateAge } from "../utils";

interface PatientSelectorCardProps {
  patientProfile?: PatientProfile | null;
  onProfileChange?: (profile: PatientProfile | null) => void;
}

function getProfileKey(profile: PatientProfile) {
  return `${profile.prenom.trim().toLowerCase()}|${profile.nom.trim().toLowerCase()}|${profile.dateNaissance}`;
}

function loadStoredProfiles() {
  const saved = localStorage.getItem("patient_profiles");

  if (!saved) return [];

  try {
    return JSON.parse(saved) as PatientProfile[];
  } catch (error) {
    console.error("Failed to load patient profiles", error);
    return [];
  }
}

export default function PatientSelectorCard({ patientProfile, onProfileChange }: PatientSelectorCardProps) {
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    prenom: "",
    nom: "",
    dateNaissance: "",
    adresse: "",
    cp: "",
    ville: "",
    tel: "",
  });

  const patientProfiles = useMemo(() => {
    const profiles = loadStoredProfiles();
    const mergedProfiles = patientProfile ? [patientProfile, ...profiles] : profiles;
    const uniqueProfiles = new Map<string, PatientProfile>();

    mergedProfiles.forEach((profile) => {
      uniqueProfiles.set(getProfileKey(profile), profile);
    });

    return Array.from(uniqueProfiles.values());
  }, [patientProfile]);

  const activePatientKey = patientProfile ? getProfileKey(patientProfile) : null;

  const selectPatient = (profile: PatientProfile) => {
    const nextProfiles = [
      profile,
      ...patientProfiles.filter((item) => getProfileKey(item) !== getProfileKey(profile)),
    ];

    localStorage.setItem("patient_profile", JSON.stringify(profile));
    localStorage.setItem("patient_profiles", JSON.stringify(nextProfiles));
    onProfileChange?.(profile);
    setShowPatientsModal(false);
    setIsAddingPatient(false);
  };

  const handleAddPatient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const profile: PatientProfile = {
      prenom: newPatient.prenom.trim(),
      nom: newPatient.nom.trim(),
      dateNaissance: newPatient.dateNaissance,
      adresse: newPatient.adresse.trim(),
      cp: newPatient.cp.trim(),
      ville: newPatient.ville.trim(),
      tel: newPatient.tel.trim(),
    };

    selectPatient(profile);
    setNewPatient({
      prenom: "",
      nom: "",
      dateNaissance: "",
      adresse: "",
      cp: "",
      ville: "",
      tel: "",
    });
  };

  return (
    <>
      {patientProfile ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group bg-natural-surface border border-natural-border p-5 rounded-4xl shadow-sm flex items-center justify-between gap-4 cursor-pointer transition-all hover:border-natural-primary/30 hover:shadow-md"
          id="patient-profile-dashboard-banner"
          role="button"
          tabIndex={0}
          onClick={() => setShowPatientsModal(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setShowPatientsModal(true);
            }
          }}
          title="Changer de patient"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-natural-primary/10 text-natural-primary flex items-center justify-center font-black text-lg shrink-0 border border-natural-border/60 shadow-sm">
              {patientProfile.prenom.charAt(0).toUpperCase()}{patientProfile.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-natural-dark font-sans leading-none">
                  {patientProfile.prenom} {patientProfile.nom}
                </h2>
                <span className="text-xs font-bold text-natural-secondary">Patient</span>
                <span className="text-[10px] bg-natural-primary/10 text-natural-primary border border-natural-primary/20 font-bold px-2 py-0.5 rounded-full font-mono">
                  {calculateAge(patientProfile.dateNaissance)} ans
                </span>
              </div>
            </div>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-natural-border/70 bg-white/70 text-natural-secondary transition-all group-hover:text-natural-primary">
            <ChevronDown className="h-5 w-5" />
          </div>
        </motion.div>
      ) : (
        <div
          className="bg-natural-surface/60 border border-dashed border-natural-border/80 p-5 rounded-4xl shadow-sm flex items-center gap-3 cursor-pointer"
          id="patient-profile-dashboard-empty"
          role="button"
          tabIndex={0}
          onClick={() => setShowPatientsModal(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setShowPatientsModal(true);
            }
          }}
        >
          <div className="p-2 bg-natural-primary/10 rounded-xl text-natural-primary">
            <UserCheck className="h-5 w-5 opacity-70" />
          </div>
          <div className="text-xs text-natural-secondary font-medium">
            💡 <span className="font-bold text-natural-dark">Astuce :</span> Renseignez votre <span className="font-bold text-natural-primary">Profil Patient</span> dans la barre latérale pour afficher votre âge, vos coordonnées et personnaliser votre tableau de bord médical.
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPatientsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-natural-dark/50 backdrop-blur-sm"
              onClick={() => setShowPatientsModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="flex max-h-[82vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-natural-border bg-natural-surface shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-natural-border/60 px-5 py-4">
                  <div>
                    <h3 className="text-base font-extrabold text-natural-dark">Changer de patient</h3>
                    <p className="text-xs font-medium text-natural-secondary">Patients enregistrés sur cet appareil</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPatient((value) => !value)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-natural-primary px-3 py-2 text-xs font-bold text-white transition-all hover:bg-[#047857]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </button>
                    <button
                      onClick={() => {
                        setShowPatientsModal(false);
                        setIsAddingPatient(false);
                      }}
                      className="rounded-full p-2 text-natural-secondary transition-all hover:bg-natural-bg hover:text-natural-dark"
                      title="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {isAddingPatient && (
                    <form
                      onSubmit={handleAddPatient}
                      className="mb-4 space-y-3 rounded-2xl border border-natural-primary/20 bg-natural-primary/5 p-4"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Prénom"
                          value={newPatient.prenom}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, prenom: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Nom"
                          value={newPatient.nom}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, nom: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                      </div>
                      <input
                        type="date"
                        required
                        value={newPatient.dateNaissance}
                        onChange={(event) => setNewPatient((patient) => ({ ...patient, dateNaissance: event.target.value }))}
                        className="w-full rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Téléphone"
                          value={newPatient.tel}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, tel: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                        <input
                          type="text"
                          placeholder="Ville"
                          value={newPatient.ville}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, ville: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                      </div>
                      <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                        <input
                          type="text"
                          placeholder="CP"
                          value={newPatient.cp}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, cp: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                        <input
                          type="text"
                          placeholder="Adresse"
                          value={newPatient.adresse}
                          onChange={(event) => setNewPatient((patient) => ({ ...patient, adresse: event.target.value }))}
                          className="rounded-xl border border-natural-border bg-white px-3 py-2 text-sm font-semibold text-natural-dark outline-none focus:border-natural-primary"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingPatient(false)}
                          className="rounded-xl px-3 py-2 text-xs font-bold text-natural-secondary hover:bg-natural-bg"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="rounded-xl bg-natural-primary px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  )}

                  {patientProfiles.length > 0 ? (
                    <div className="space-y-1.5">
                      {patientProfiles.map((profile) => {
                        const isActive = getProfileKey(profile) === activePatientKey;

                        return (
                          <button
                            type="button"
                            key={getProfileKey(profile)}
                            onClick={() => selectPatient(profile)}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-natural-primary/40 hover:bg-natural-primary/5 ${
                              isActive
                                ? "border-natural-primary/40 bg-natural-primary/10"
                                : "border-natural-border/50 bg-natural-bg/40"
                            }`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                              isActive
                                ? "bg-natural-primary text-white"
                                : "bg-natural-primary/10 text-natural-primary"
                            }`}>
                              {profile.prenom.charAt(0).toUpperCase()}{profile.nom.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-natural-dark">
                                {profile.prenom} {profile.nom}
                              </p>
                              <p className="text-xs font-medium text-natural-secondary">
                                {calculateAge(profile.dateNaissance)} ans
                              </p>
                            </div>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isActive
                                ? "border-natural-primary bg-natural-primary text-white"
                                : "border-natural-border bg-white"
                            }`}>
                              {isActive && <Check className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-natural-border bg-natural-bg/40 p-4 text-sm text-natural-secondary">
                      Aucun patient enregistré pour le moment. Cliquez sur <span className="font-bold text-natural-primary">Ajouter</span>.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

