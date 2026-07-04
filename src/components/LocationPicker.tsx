import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAppStore } from '../store/useAppStore';

interface HierarchyNode { id: string; name: string; }

const toNodes = (snapshot: Awaited<ReturnType<typeof getDocs>>): HierarchyNode[] =>
  snapshot.docs.map(doc => ({
    id: doc.id,
    name: (doc.data() as { name: string }).name,
  }));

type Props = {
  onSelectNode: (nodeId: string, nodeName: string) => void;
};

export function LocationPicker({ onSelectNode }: Props) {
  const { currentCampus } = useAppStore();
  const [blocks, setBlocks] = useState<HierarchyNode[]>([]);
  const [floors, setFloors] = useState<HierarchyNode[]>([]);
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedBlockName, setSelectedBlockName] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedFloorName, setSelectedFloorName] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentCampus) return;
    
    try {
      const localData = require('../../jamia_hamdard_data.json');
      // For now we assume currentCampus matches the JSON or we just use the JSON directly
      if (localData.blocks) {
        const parsedBlocks = localData.blocks.map((b: any) => ({ id: b.id, name: b.name }));
        setBlocks(parsedBlocks);
      }
    } catch (error) {
      console.warn("Failed to load local campus data:", error);
    }
  }, [currentCampus]);

  const handleBlockSelect = (block: HierarchyNode) => {
    setSelectedBlock(block.id);
    setSelectedBlockName(block.name);
    setSelectedFloor(null);
    setSelectedNode(null);
    setFloors([]);
    setNodes([]);
    
    // Load from JSON
    const localData = require('../../jamia_hamdard_data.json');
    const selectedBlockData = localData.blocks.find((b: any) => b.id === block.id);
    if (selectedBlockData && selectedBlockData.floors) {
      const parsedFloors = selectedBlockData.floors.map((f: any) => ({ id: f.id, name: f.name }));
      setFloors(parsedFloors);
    }
  };

  const handleFloorSelect = (floor: HierarchyNode) => {
    setSelectedFloor(floor.id);
    setSelectedFloorName(floor.name);
    setSelectedNode(null);
    setNodes([]);
    
    // Load from JSON
    const localData = require('../../jamia_hamdard_data.json');
    const selectedBlockData = localData.blocks.find((b: any) => b.id === selectedBlock);
    if (selectedBlockData) {
      const selectedFloorData = selectedBlockData.floors.find((f: any) => f.id === floor.id);
      if (selectedFloorData && selectedFloorData.nodes) {
        const parsedNodes = selectedFloorData.nodes.map((n: string) => ({ id: n, name: n }));
        setNodes(parsedNodes);
      }
    }
  };

  const handleNodeSelect = (node: HierarchyNode) => {
    setSelectedNode(node.id);
    const fullName = [selectedBlockName, selectedFloorName, node.name].filter(Boolean).join(' › ');
    onSelectNode(node.id, fullName);
  };

  return (
    <View style={styles.container}>
      {/* Step 1: Block */}
      <View style={styles.stepSection}>
        <View style={styles.stepLabel}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.stepTitle}>Building / Block</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {blocks.length === 0 ? (
            <Text style={styles.noData}>No blocks found for this campus</Text>
          ) : blocks.map(b => (
            <TouchableOpacity
              key={b.id}
              onPress={() => handleBlockSelect(b)}
              style={[styles.chip, selectedBlock === b.id && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="business-outline" size={13} color={selectedBlock === b.id ? '#fff' : '#6b7280'} />
              <Text style={[styles.chipText, selectedBlock === b.id && styles.chipTextActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Step 2: Floor */}
      {selectedBlock && (
        <View style={styles.stepSection}>
          <View style={styles.stepLabel}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepTitle}>Floor / Level</Text>
          </View>
          {loading && floors.length === 0 ? (
            <ActivityIndicator size="small" color="#0c831f" style={{ marginLeft: 8 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {floors.map(f => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => handleFloorSelect(f)}
                  style={[styles.chip, selectedFloor === f.id && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="layers-outline" size={13} color={selectedFloor === f.id ? '#fff' : '#6b7280'} />
                  <Text style={[styles.chipText, selectedFloor === f.id && styles.chipTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Step 3: Room/Node */}
      {selectedFloor && (
        <View style={styles.stepSection}>
          <View style={styles.stepLabel}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepTitle}>Room / Desk</Text>
          </View>
          {loading && nodes.length === 0 ? (
            <ActivityIndicator size="small" color="#0c831f" style={{ marginLeft: 8 }} />
          ) : (
            <View style={styles.nodeGrid}>
              {nodes.map(n => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => handleNodeSelect(n)}
                  style={[styles.nodeChip, selectedNode === n.id && styles.nodeChipActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={selectedNode === n.id ? 'checkmark-circle' : 'cube-outline'} size={13} color={selectedNode === n.id ? '#fff' : '#6b7280'} />
                  <Text style={[styles.nodeChipText, selectedNode === n.id && styles.nodeChipTextActive]}>{n.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 14 },
  stepSection: { marginBottom: 14 },
  stepLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0c831f', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  stepTitle: { fontSize: 11, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 5 },
  chipActive: { backgroundColor: '#0c831f', borderColor: '#0c831f' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  nodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nodeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 5 },
  nodeChipActive: { backgroundColor: '#0c831f', borderColor: '#0c831f' },
  nodeChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  nodeChipTextActive: { color: '#fff' },
  noData: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginLeft: 4 },
});