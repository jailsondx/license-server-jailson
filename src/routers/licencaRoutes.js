import express from "express";
import { ativarLicenca, validarLicenca } from "../services/licencaService.js";
import { prisma } from "../controller/prisma.js";

const licencaRoutes = express.Router();

licencaRoutes.post("/ativar", async (req, res) => {
  const { chave_licenca, machine_id } = req.body;

  try {
    const result = await ativarLicenca(prisma, chave_licenca, machine_id);
    return handleResponse(res, result);
  } catch (error) {
    handleError(res, error);
  }
});


licencaRoutes.post("/validar", async (req, res) => {
  const { chave_licenca, machine_id } = req.body;

  try {
    const result = await validarLicenca(prisma, chave_licenca, machine_id);
    return handleResponse(res, result);
  } catch (error) {
    handleError(res, error);
  }
});



// Métodos auxiliares para padronizar respostas e erros
const handleResponse = (res, result) => {
  return res.status(200).json({
    success: result.success,
    code: result.code,
    message: result.message,
    data: result.data ?? null,
    error: result.error ?? null
  });
};

const handleError = (res, error) => {
  console.error('Erro no processamento:', error);
  return res.status(500).json({
    message: 'Erro interno do servidor',
    error: 'Erro desconhecido',
  });
};

export default licencaRoutes;