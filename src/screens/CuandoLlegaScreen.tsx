import { useState, useEffect, useMemo } from "react";
import { Box, Typography, AppBar, Toolbar, Skeleton, Fab } from "@mui/material";
import { IconSearch, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { getParadaInfo } from "../services/api";
import ArriboCard from "../components/ArriboCard";
import StopHeader from "../components/StopHeader";
import type { Arribo, ParadaInfo } from "../types";
import { tokens } from "../theme";

export default function CuandoLlegaScreen() {
  const { id } = useParams<{ id: string }>();
  const [arribos, setArribos] = useState<Arribo[]>([]);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setSecondsLeft(30);

    const fetchData = async () => {
      try {
        const result = await getParadaInfo(id);
        setArribos(result.arribos || []);
        setParada(result.parada?.[0] || null);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const pollTimer = setInterval(fetchData, 30000);
    const countdownTimer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 30 : s - 1));
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(countdownTimer);
    };
  }, [id]);

  const grupos = useMemo(() => {
    const map = new Map<string, Arribo[]>();
    for (const item of arribos) {
      const key = item.codigoLinea;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    for (const [, items] of map) {
      items.sort((a, b) => {
        if (a.tiempoArriboMinutos === null) return 1;
        if (b.tiempoArriboMinutos === null) return -1;
        return a.tiempoArriboMinutos - b.tiempoArriboMinutos;
      });
    }
    return Array.from(map.entries()).map(([codigoLinea, items]) => {
      const first = items[0];
      return {
        codigoLinea,
        descripcionLinea: first.descripcionLinea,
        descripcionCortaBandera: first.descripcionCortaBandera,
        arribos: items,
      };
    });
  }, [arribos]);

  const seleccionarArribo = (arriboItem: Arribo) => {
    navigate(`/detalle/${id}/${arriboItem.identificadorCoche}`);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: tokens.bg }}>
      <AppBar position="static" sx={{ bgcolor: tokens.brand }}>
        <Toolbar disableGutters sx={{ minHeight: "48px !important" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              maxWidth: 640,
              mx: "auto",
              px: 1.5,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={() => navigate(-1)}
            >
              <IconArrowLeft size={14} color="#FFFFFF" />
            </Box>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 18,
                color: "#FFFFFF",
                lineHeight: 1.2,
              }}
            >
              Cuándo llega
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {parada ? (
        <StopHeader parada={parada} secondsLeft={secondsLeft} />
      ) : (
        <Box
          sx={{
            bgcolor: tokens.surface,
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 1.5 }}>
            <Skeleton variant="rounded" width={90} height={20} sx={{ borderRadius: 1, mb: 0.5 }} />
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton variant="text" width="35%" height={18} />
            <Skeleton variant="text" width={120} height={14} sx={{ mt: 0.75 }} />
          </Box>
        </Box>
      )}

      <Box sx={{ maxWidth: 640, mx: "auto", px: 0, pb: 10 }}>
        {loading &&
          [0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                mx: 1.5,
                mt: 1.5,
                bgcolor: tokens.surface,
                borderRadius: "16px",
                border: `1px solid ${tokens.border}`,
                borderLeft: `3px solid ${tokens.brand}`,
                p: 1.75,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Skeleton
                  variant="rounded"
                  width={34}
                  height={34}
                  sx={{ borderRadius: "10px" }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Skeleton variant="text" width={40} height={18} />
                    <Skeleton
                      variant="rounded"
                      width={50}
                      height={16}
                      sx={{ borderRadius: "5px" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <Skeleton variant="text" width={80} height={14} />
                  </Box>
                </Box>
                <Skeleton
                  variant="rounded"
                  width={56}
                  height={22}
                  sx={{ borderRadius: "8px" }}
                />
                <Skeleton variant="circular" width={22} height={22} />
              </Box>
            </Box>
          ))}

        {!loading && (
          <Box>
            {grupos.length > 0 && (
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: tokens.textMuted,
                  textTransform: "uppercase",
                  px: 2,
                  pt: 1.25,
                  pb: 0.5,
                }}
              >
                En camino
              </Typography>
            )}

            <Box sx={{ px: 1.25 }}>
              {grupos.map((grupo) => (
                <ArriboCard
                  key={grupo.codigoLinea}
                  codigoLinea={grupo.codigoLinea}
                  descripcionLinea={grupo.descripcionLinea}
                  descripcionCortaBandera={grupo.descripcionCortaBandera}
                  arribos={grupo.arribos}
                  onVerDetalle={seleccionarArribo}
                />
              ))}
            </Box>

            {arribos.length === 0 && (
              <Typography
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: tokens.textSecondary,
                  fontSize: 14,
                }}
              >
                No hay colectivos en camino
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Fab
        sx={{
          position: "fixed",
          bottom: 16,
          right: "max(16px, calc(50vw - 320px + 16px))",
          width: 44,
          height: 44,
          bgcolor: tokens.brand,
          boxShadow: `0 3px 10px rgba(240,85,16,0.35)`,
          "&:hover": { bgcolor: tokens.brandDark },
        }}
        onClick={() => navigate("/")}
      >
        <IconSearch size={20} color="#FFFFFF" />
      </Fab>
    </Box>
  );
}
