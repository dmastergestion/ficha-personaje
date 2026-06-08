import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ABILITY_KEYS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { ABILITY_LABELS_ES, iniciativa } from "@/rules/character";
import { calcularClaseArmadura } from "@/rules/combat";
import { descripcionClases } from "@/rules/multiclass";
import type { Character } from "@/schemas/character";
import { srdArmor, t } from "@/rules/srd";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8, fontWeight: "bold" },
  subtitle: { fontSize: 11, marginBottom: 16, color: "#444" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 100, color: "#555" },
  abilities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ability: { width: "30%", marginBottom: 6 },
});

interface FichaPdfDocumentProps {
  character: Character;
  armorClass: number;
}

export function FichaPdfDocument({ character, armorClass }: FichaPdfDocumentProps) {
  const pb = bonificadorCompetencia(character.identity.level);

  return (
    <Document title={`Ficha — ${character.identity.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{character.identity.name}</Text>
        <Text style={styles.subtitle}>
          {character.identity.playerName || "Sin jugador"} ·{" "}
          {descripcionClases(character.identity.classes)} · Total {character.identity.level} · PB +{pb}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combate</Text>
          <View style={styles.row}>
            <Text style={styles.label}>PV</Text>
            <Text>
              {character.combat.hpCurrent}/{character.combat.hpMax}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CA</Text>
            <Text>{armorClass}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Iniciativa</Text>
            <Text>{iniciativa(character)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atributos</Text>
          <View style={styles.abilities}>
            {ABILITY_KEYS.map((key) => (
              <View key={key} style={styles.ability}>
                <Text>
                  {ABILITY_LABELS_ES[key]} {character.abilities[key]} (
                  {modificadorAtributo(character.abilities[key]) >= 0 ? "+" : ""}
                  {modificadorAtributo(character.abilities[key])})
                </Text>
              </View>
            ))}
          </View>
        </View>

        {character.identity.speciesId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Origen</Text>
            <Text>
              {t("species", character.identity.speciesId, character.identity.speciesId)}
            </Text>
          </View>
        )}

        {character.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text>{character.notes}</Text>
          </View>
        ) : null}

        <Text style={{ marginTop: 24, fontSize: 8, color: "#888" }}>
          Ficha generada · SRD 5.2.1 CC BY 4.0 · No es réplica oficial WoTC
        </Text>
      </Page>
    </Document>
  );
}

export function calcularCaParaPdf(character: Character): number {
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  return calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
}
